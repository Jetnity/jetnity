/** Real loopback response delivery through the unchanged pinned SDK/factory and
 * actual owned fetch. Headers/body bytes come from the native RLS Trip query. */
import assert from 'node:assert/strict'
import { isErrored } from 'node:stream'
import type { TestContext } from 'node:test'
import { TRIP_GRAPH_SELECT_KANONISCH } from '@/lib/trips/foundation-e-select'
import type { nativeProductRuntime } from './native-loader'
import { nativeTrip,type startNativeHttp } from './native-http'

type Runtime=ReturnType<typeof nativeProductRuntime>
type Protocol=Awaited<ReturnType<typeof startNativeHttp>>
const turn=()=>new Promise<void>(resolve=>setImmediate(resolve))
// Node22's public isErrored accepts a Web ReadableStream, while locked
// @types/node22.20.1 omits that overload. This test-only declaration boundary
// passes the same genuine native body unchanged; no stream/state is fabricated.
const nativeBodyErrored=(body:NonNullable<Response['body']>)=>isErrored(body as unknown as Parameters<typeof isErrored>[0])
function holdGraph(http:Protocol,phase:'headers'|'body') {
  let entered!:()=>void,release!:()=>void
  const reached=new Promise<void>(resolve=>{entered=resolve}),released=new Promise<void>(resolve=>{release=resolve})
  http.faults.graphHold={phase,released,entered}
  return {reached,release,clear:()=>{release();delete http.faults.graphHold}}
}
function observeNative(life:InstanceType<Runtime['lifetime']['AcceptedStoreLifetime']>,onHeaders?:()=>void) {
  const original=globalThis.fetch
  let starts=0,afterOwnerAbort=0,headers!: (response:Response)=>void,failed!: (error:unknown)=>void,genuine:Response|null=null
  const received=new Promise<Response>((resolve,reject)=>{headers=resolve;failed=reject})
  void received.catch(()=>undefined)
  globalThis.fetch=((input,init)=>{
    starts++;if(life.signal.aborted)afterOwnerAbort++
    // The original native Response and errors pass through without replacement.
    return original(input,init).then(response=>{genuine=response;headers(response);onHeaders?.();return response},error=>{failed(error);throw error})
  }) as typeof fetch
  return {received,counts:()=>({starts,afterOwnerAbort}),body:()=>genuine?.body,restore:()=>{globalThis.fetch=original}}
}

export async function nativeFetchBoundaryProof(t:TestContext,runtime:Runtime,http:Protocol) {
  const cases:string[]=[]
  for(const mode of ['request_signal','init_signal','owner_signal','complete_body','late_headers','abort_at_headers'] as const) {
    const parent=new AbortController(),requestOwner=new AbortController(),initOwner=new AbortController()
    const life=new runtime.lifetime.AcceptedStoreLifetime(parent.signal,10_000)
    const hold=holdGraph(http,mode==='late_headers'?'headers':'body')
    const observed=observeNative(life,mode==='abort_at_headers'?()=>parent.abort():undefined)
    const url=new URL(`${http.url}/rest/v1/trips`)
    url.searchParams.set('select',TRIP_GRAPH_SELECT_KANONISCH.replace(/\s/g,''));url.searchParams.set('id',`eq.${nativeTrip}`);url.searchParams.set('limit','1')
    const request=new Request(url,{headers:{Authorization:`Bearer ${http.accessToken}`,apikey:http.anonToken},signal:requestOwner.signal})
    let returned=false,lifeSettled=false
    let returnState:{present:boolean;errored:boolean;locked:boolean}|null=null
    const recordReturn=()=>{const body=observed.body();returnState={present:!!body,errored:body?nativeBodyErrored(body):false,locked:body?.locked??false}}
    const operation=life.fetch(request,{signal:initOwner.signal}).then(
      response=>{recordReturn();return {ok:true as const,response}},error=>{recordReturn();return {ok:false as const,error}})
      .finally(()=>{returned=true})
    try {
      // Only entry/failure notifications are raced. The actual operation and
      // held server work remain owned and are always drained in finally.
      await Promise.race([hold.reached,operation.then(()=>{throw Error('outgoing operation ended before actual RLS response hold')})])
      if(mode!=='late_headers')await observed.received
      await turn()
      if(mode!=='abort_at_headers') {
        assert.equal(returned,false,'Headers/partial body alone must not settle the owned fetch')
        if(mode!=='late_headers')assert.equal(observed.body()?.locked,true,'The actual native response body is owned while pending')
      }
      assert.equal(observed.counts().starts,1)
      if(mode==='abort_at_headers') {
        const outcome=await operation;assert.equal(outcome.ok,false)
        assert.equal(life.signal.aborted,true);assert.equal(observed.body()?.locked,false)
        const body=observed.body();assert(body)
        // Synchronous public stream state at BOTH product-return boundaries,
        // before a test reader, cancellation, or server-hold release can wait
        // for/force eventual termination and mask unowned body work.
        assert.deepEqual(returnState,{present:true,errored:true,locked:false},
          'Capture actual native terminal state in the immediate product-promise continuation, before the shared event-loop turn')
        await life.settle();lifeSettled=true
        assert.equal(nativeBodyErrored(body),true,'Native body must already be terminal at owned settle return')
        assert.equal(body.locked,false)
        // Abort happens after a genuine fulfilled native Response and before
        // the product wrapper acquires its reader. Observe terminal stream
        // state separately from the remote HTTP peer's later close/drain.
        const reader=body.getReader()
        try {await assert.rejects(reader.read())}finally{reader.releaseLock()}
        const starts=observed.counts().starts
        await assert.rejects(life.fetch(request,{signal:initOwner.signal}));assert.equal(observed.counts().starts,starts)
      } else if(mode==='complete_body') {
        hold.clear();const outcome=await operation;assert(outcome.ok);life.assertCurrent()
        const body=await outcome.response.json() as {id:string}[]
        assert.equal(body.length,1);assert.equal(body[0]!.id,nativeTrip)
      } else {
        if(mode==='request_signal')requestOwner.abort()
        else if(mode==='init_signal')initOwner.abort()
        else parent.abort()
        const outcome=await operation;assert.equal(outcome.ok,false)
        if(mode==='request_signal'||mode==='init_signal') {
          assert.equal(life.signal.aborted,false,'A distinct Request/init abort must not close the owner lifetime')
          life.assertCurrent()
          assert.equal(mode==='request_signal'?initOwner.signal.aborted:requestOwner.signal.aborted,false)
        } else {
          assert.equal(requestOwner.signal.aborted,false);assert.equal(initOwner.signal.aborted,false)
          assert.throws(()=>life.assertCurrent())
        }
        const starts=observed.counts().starts
        await assert.rejects(life.fetch(request,{signal:initOwner.signal}))
        assert.equal(observed.counts().starts,starts,'A pre-aborted composed signal must refuse before native fetch')
      }
      if(mode!=='late_headers')assert.equal(observed.body()?.locked,false,'Actual body reader must be released before operation settlement')
    } finally {
      hold.clear();parent.abort()
      try {await operation;if(!lifeSettled)await life.settle();await http.settle()}
      finally {observed.restore()}
    }
    assert.equal(observed.counts().afterOwnerAbort,0);cases.push(mode)
  }

  for(const mode of ['query_only','owner'] as const) {
    const parent=new AbortController(),queryOwner=new AbortController(),life=new runtime.lifetime.AcceptedStoreLifetime(parent.signal,10_000)
    const observed=observeNative(life),hold=holdGraph(http,'body')
    let operation:Promise<unknown>|null=null
    try {
      const client=await runtime.factory.createServerComponentClient(life.signal)
      life.assertCurrent()
      const query=(signal:AbortSignal)=>life.run(()=>Promise.resolve(client.from('trips').select(TRIP_GRAPH_SELECT_KANONISCH)
        .eq('id',nativeTrip).limit(1).abortSignal(signal)))
      let returned=false
      const pending=query(queryOwner.signal).finally(()=>{returned=true});operation=pending
      await Promise.race([hold.reached,pending.then(()=>{throw Error('SDK query ended before actual RLS response hold')})])
      await observed.received;await turn();assert.equal(returned,false)
      assert.equal(observed.body()?.locked,true)
      if(mode==='query_only')queryOwner.abort();else parent.abort()
      const result=await pending;assert(result.error);assert.equal(result.data,null)
      assert.equal(observed.body()?.locked,false)
      assert.equal(life.signal.aborted,mode==='owner');assert.equal(queryOwner.signal.aborted,mode==='query_only')
      hold.clear();await http.settle()
      const starts=observed.counts().starts
      if(mode==='query_only') {
        life.assertCurrent()
        const repeated=await query(queryOwner.signal);assert(repeated.error);assert.equal(observed.counts().starts,starts)
        // A new explicit query is still usable through the same genuine client
        // because aborting one PostgREST query does not revoke its owner.
        const current=await query(new AbortController().signal);life.assertCurrent()
        assert.equal(current.error,null);assert.equal(current.data?.[0]?.id,nativeTrip)
        assert.equal(observed.counts().starts,starts+1)
      } else {
        await assert.rejects(query(new AbortController().signal));assert.equal(observed.counts().starts,starts)
      }
    } finally {
      hold.clear();parent.abort()
      try {if(operation)await Promise.allSettled([operation]);await life.settle();await http.settle()}
      finally {observed.restore()}
    }
    assert.equal(observed.counts().afterOwnerAbort,0);cases.push(`actual_factory_${mode}`)
  }
  assert.equal(http.counts().active,0);assert.equal(http.counts().connections,0)
  t.diagnostic(JSON.stringify({proof:'actual-outgoing-native-fetch-and-query-boundaries',cases,
    realNativeResponses:true,actualRlsTripBytes:true,allRequestInitOwnerSignalsComposed:true,
    headersDoNotSettlePendingBody:true,postHeadersPreReaderAbortTerminal:true,bodyReadersReleased:true,queryOnlyOwnerRemainsLive:true,
    noNativeStartsAfterOwnerAbort:true,allClientAndServerWorkAwaited:true,
    boundary:'No instantaneous TCP-close claim; actual native fetch/body and fixture HTTP handlers are separately awaited'}))
}
