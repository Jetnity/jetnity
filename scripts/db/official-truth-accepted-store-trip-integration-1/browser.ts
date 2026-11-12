/** Required mounted browser proof fed by genuine fresh native DB read results.
 * No positive DTO, provider evaluation, hook or presentation module is replaced. */
import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import { createHash } from 'node:crypto'
import { createServer,type IncomingMessage,type ServerResponse } from 'node:http'
import { existsSync,readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { chromium,type Request as PlaywrightRequest,type Response as PlaywrightResponse } from 'playwright'
import { startLocalProofCluster,assertLocalProofEnvironment } from '../official-truth-integrated-pilot-1/local-cluster'
import { nativeSql,installNativeSchema,quote } from './native-schema'
import { startNativeHttp } from './native-http'
import { nativeProductRuntime,type NativeRuntimeState } from './native-loader'
import { seedNativeRows,seedNativeCatalog,nativeBinding,declareNativeTrip,nativeIds } from './native-fixture'
import { nativeBrowserBundle } from './browser-bundle'
import { travellerKontoEingabeSchema } from '@/lib/readiness/schema'
import { travellerAlsPayload,travellerBauen } from '@/lib/readiness/reisende'
import { pgText } from '../official-truth-integrated-pilot-1/pg-wire'
import type { BrowserFixtureDiagnostic } from './browser-entry'
import type { AcceptedStoreTripResult } from '@/lib/readiness/official-truth-accepted-store-trip-integration-1/result'

type BrowserFetchObservation={
  sequence:number;startedAt:number;headersAt:number|null;fetchSettledAt:number|null;
  abortedAt:number|null;status:number|null;bodyUsedAtAbort:boolean|null;bodyLockedAtAbort:boolean|null;
  abortDom:{status:string|null;busy:string|null;visibility:string}|null;fetchError:'abort'|'type'|'other'|null;observerError:boolean;
}
type BrowserReadObservations={sequence:number;omitted:number;reads:BrowserFetchObservation[]}
type BrowserCaptureError='invalid_headers'|'missing_body'|'multiple_readers'|'read_failed'|'invalid_chunk'|'bound'|'observer'
type BrowserCaptureMetadata={
  id:string;status:number;headerHash:string;headerBytes:number;bytes:number;done:boolean;readerAcquired:boolean;
  readCalls:number;pending:number;error:BrowserCaptureError|null;taken:boolean;
}
type BrowserCaptureOwnership={started:number;settled:number;pending:number;retainedBytes:number;observerErrors:number}
type BrowserCaptureControl={
  snapshot():BrowserReadObservations;
  metadata(id:string):BrowserCaptureMetadata|null;
  take(id:string):{metadata:BrowserCaptureMetadata;bytes:number[]}|null;
  drain():Promise<BrowserCaptureOwnership>;
  release():BrowserCaptureOwnership;
}
type ReadAttemptObservation={
  action:number;startedAt:number;requestAt:number|null;requestCount:number;responseAt:number|null;status:number|null;
  finishedAt:number|null;failedAt:number|null;requestFailure:string|null;bodyStartedAt:number|null;bodySettledAt:number|null;
  bodyOutcome:'fulfilled'|'rejected'|null;failureTag:string|null;ownedStarted:number;ownedSettled:number;
  browser:BrowserReadObservations|null;diagnosticUnavailable:boolean;
  capture:(BrowserCaptureMetadata&{sha256:string})|null;observerDrain:BrowserCaptureOwnership|null;
}

export async function mountedAcceptedStoreProof(t:TestContext){
  assert.equal(process.versions.node.split('.')[0],'22');assertLocalProofEnvironment()
  for(const [name,version] of [['react','19.2.8'],['react-dom','19.2.8'],['playwright','1.55.0']])
    assert.equal(JSON.parse(readFileSync(`node_modules/${name}/package.json`,'utf8')).version,version)
  const executablePath=['/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'].find(existsSync)
  assert(executablePath,'Required installed system browser; no download or optional skip')
  const binaryVersion=execFileSync(executablePath,['--version'],{encoding:'utf8',timeout:15_000}).trim()
  const bundle=nativeBrowserBundle(),cluster=startLocalProofCluster(),sql=nativeSql(cluster)
  let protocol:Awaited<ReturnType<typeof startNativeHttp>>|null=null,witness:Awaited<ReturnType<typeof nativeBinding>>|null=null
  let browser:Awaited<ReturnType<typeof chromium.launch>>|null=null,server:ReturnType<typeof createServer>|null=null
  const envKeys=['NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_ANON_KEY','SUPABASE_SERVICE_ROLE_KEY'] as const
  const previous=Object.fromEntries(envKeys.map(key=>[key,process.env[key]]))
  const active=new Set<Promise<void>>(),pendingPilots=new Set<()=>void>(),errors:string[]=[],outbound:string[]=[],proofs:string[]=[]
  let stage='bootstrap',storeRequests=0,pilotRequests=0,travellerWrites=0,pilotPending=false,storeFailure=false,origin=''
  let lastClientObservation:{received:BrowserFixtureDiagnostic;failure:BrowserFixtureDiagnostic|null;
    dom:{status:string|null;busy:string|null;draftBlocked:string|null;positiveCount:number;visibility:string;wallNow:number;monotonicNow:number}|null}|null=null
  let lastReadObservation:ReadAttemptObservation|null=null,readAction=0
  const results:AcceptedStoreTripResult[]=[]
  const sentBodies=new Map<string,{id:string;status:number;bytes:number;sha256:string;sent:boolean}>()
  try {
    installNativeSchema(sql);seedNativeRows(sql)
    // A second citizenship on the OTHER person makes its real remove control
    // available without changing the selected sole-CH passport scope.
    sql(`insert into public.trip_traveller_citizenships(id,traveller_id,trip_id,user_id,client_ref,country_code)
      select '77777777-7777-4777-8777-777777777779',traveller_id,trip_id,user_id,'synthetic-other-second-citizenship','DE'
      from public.trip_traveller_citizenships where id=${quote(nativeIds.otherCitizen)}`)
    protocol=await startNativeHttp(cluster)
    process.env.NEXT_PUBLIC_SUPABASE_URL=protocol.url;process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY=protocol.anonToken;process.env.SUPABASE_SERVICE_ROLE_KEY=protocol.serviceToken
    await seedNativeCatalog(protocol);witness=await nativeBinding(protocol.url,sql)
    const state:NativeRuntimeState={binding:witness.binding,cookie:protocol.cookie(),successor:false,sourceStarts:0,authCookieReads:0}
    const runtime=nativeProductRuntime(state);let trip=await declareNativeTrip(protocol,runtime)
    const published=await runtime.producer.publishAcceptedStore(new AbortController().signal)
    assert.equal(published.status,'confirmed',JSON.stringify(protocol.evidence.slice(-8)))
    const sourceStarts=state.sourceStarts
    const send=(response:ServerResponse,status:number,value:unknown)=>{if(!response.destroyed){response.writeHead(status,{'content-type':'application/json','cache-control':'no-store'});response.end(JSON.stringify(value))}}
    const sendRead=(response:ServerResponse,id:string,status:number,value:unknown)=>{
      // Exactly one serialization supplies both the sent native HTTP bytes
      // and their bounded fixture descriptor. No positive DTO is substituted.
      const bytes=Buffer.from(JSON.stringify(value),'utf8'),sha256=createHash('sha256').update(bytes).digest('hex')
      const descriptor={id,status,bytes:bytes.byteLength,sha256,sent:false};sentBodies.set(id,descriptor)
      if(sentBodies.size>32)sentBodies.delete(sentBodies.keys().next().value!)
      if(!response.destroyed){
        response.writeHead(status,{'content-type':'application/json','cache-control':'no-store',
          'x-jetnity-fixture-read':id,'x-jetnity-fixture-body-sha256':sha256,'x-jetnity-fixture-body-bytes':String(bytes.byteLength)})
        response.end(bytes);descriptor.sent=true
      }
    }
    async function handle(req:IncomingMessage,res:ServerResponse){
      const controller=new AbortController();res.once('close',()=>controller.abort())
      if(req.url==='/fixture'&&req.method==='GET'){send(res,200,trip);return}
      if(req.url==='/fixture/traveller'&&req.method==='POST'){
        const parts:Buffer[]=[];let bytes=0
        for await(const chunk of req){bytes+=(chunk as Buffer).length;assert(bytes<=32768);parts.push(Buffer.from(chunk))}
        const input=travellerKontoEingabeSchema.parse({...JSON.parse(Buffer.concat(parts).toString('utf8')),tripId:trip.id})
        const loaded=await runtime.trips.reiseLaden(trip.id);assert.equal(loaded.problem,null);const own=loaded.zeilen[0];assert(own)
        const built=travellerBauen(own,input,own.party?.find(value=>value.clientRef===input.clientRef)??null);assert(built.ok)
        await protocol!.transaction('authenticated',protocol!.claims,async connection=>{
          await connection.query('select public.party_schreiben($1::jsonb)',[pgText(JSON.stringify({tripId:own.id,party:[travellerAlsPayload(built.item)]}))]);return null
        })
        travellerWrites++
        // Explicit CLOSED FIXTURE re-attestation through the real canonical
        // context RPC; no production auto-declaration or positive DTO exists.
        trip=await declareNativeTrip(protocol!,runtime);send(res,200,{saved:true});return
      }
      if(req.url==='/'&&req.method==='GET'){res.writeHead(200,{'content-type':'text/html; charset=utf-8','cache-control':'no-store'});res.end('<!doctype html><html lang="de"><head><meta charset="utf-8"></head><body><div id="root"></div><script src="/bundle.js"></script></body></html>');return}
      if(req.url==='/bundle.js'){res.writeHead(200,{'content-type':'text/javascript; charset=utf-8','cache-control':'no-store'});res.end(bundle.code);return}
      if(req.url==='/api/readiness/ch-de-application'){
        pilotRequests++
        if(pilotPending)await new Promise<void>(resolve=>{const done=()=>{pendingPilots.delete(done);resolve()};pendingPilots.add(done);controller.signal.addEventListener('abort',done,{once:true})})
        // Only an unavailable old-pilot transport is simulated. No positive
        // pilot DTO, capability, source response or legal result is invented.
        send(res,503,{message:'Closed fixture pilot transport unavailable'});return
      }
      if(req.url==='/api/readiness/accepted-store'&&req.method==='POST'){
        // Capture once at admission; a later concurrent response cannot alias
        // this request through the mutable global storeRequests counter.
        const responseId=`accepted-read-${++storeRequests}`
        if(storeFailure){sendRead(res,responseId,503,{message:'Closed fixture transport failure'});return}
        const parts:Buffer[]=[];let bytes=0
        for await(const chunk of req){bytes+=(chunk as Buffer).length;assert(bytes<=8192);parts.push(Buffer.from(chunk))}
        runtime.rate.readinessRateLeeren()
        const request=new Request(`${origin}${req.url}`,{method:'POST',signal:controller.signal,
          headers:{origin:req.headers.origin??'','content-type':String(req.headers['content-type']??''),'sec-fetch-site':String(req.headers['sec-fetch-site']??'')},
          body:Buffer.concat(parts).toString('utf8')})
        const response=await runtime.request.acceptedStoreTripRequest(request)
        if(response.status===200&&typeof response.body==='object'&&response.body!==null&&'status'in response.body)results.push(response.body as AcceptedStoreTripResult)
        sendRead(res,responseId,response.status,response.body);return
      }
      send(res,404,{message:'Closed fixture endpoint'})
    }
    server=createServer((req,res)=>{const pending=handle(req,res).catch(error=>{errors.push(`fixture:${error instanceof Error?error.message:'unknown'}`);send(res,500,{message:'fixture failure'})}).finally(()=>active.delete(pending));active.add(pending)})
    await new Promise<void>(resolve=>server!.listen(0,'127.0.0.1',resolve));const address=server.address();assert(address&&typeof address==='object');origin=`http://127.0.0.1:${address.port}`
    browser=await chromium.launch({executablePath,headless:true})
    assert(binaryVersion.includes(browser.version()),'Recorded launch target must be the actual running system browser')
    const context=await browser.newContext({viewport:{width:1280,height:900},reducedMotion:'reduce'})
    await context.route('**/*',route=>{const url=new URL(route.request().url());if(url.origin!==origin){outbound.push(url.origin);return route.abort()}return route.continue()})
    const page=await context.newPage();page.on('pageerror',error=>errors.push((error.stack??error.message).slice(0,2048)));page.setDefaultTimeout(45_000)
    // Fixture-only observation of the exact native reader used by boundedJson.
    // Original fetch/read promises, Response, Reader, result and errors pass
    // through unchanged. The observer never reads, cancels, clones or tees.
    await page.addInitScript(()=>{
      const original=window.fetch.bind(window),limit=2*1024*1024
      const observation:BrowserReadObservations={sequence:0,omitted:0,reads:[]}
      const captures=new Map<string,BrowserCaptureMetadata&{chunks:Uint8Array[]}>()
      const work={
        pending:new Set<Promise<void>>(),started:0,settled:0,retainedBytes:0,observerErrors:0,
        own(pending:Promise<void>,entry:BrowserFetchObservation,capture?:BrowserCaptureMetadata){
          this.started++;if(capture)capture.pending++
          const owned=pending.then(()=>{
            this.settled++;if(capture)capture.pending--;this.pending.delete(owned)
          },()=>{
            entry.observerError=true;this.observerErrors++;if(capture){capture.error='observer';capture.pending--}
            this.settled++;this.pending.delete(owned)
          })
          this.pending.add(owned)
          // Bookkeeping is also handled immediately; it is never a dependency
          // of the product's original promise or an unobserved rejection.
          void owned.catch(()=>{entry.observerError=true;this.observerErrors++})
        },
        metadata(capture:BrowserCaptureMetadata):BrowserCaptureMetadata{
          return {id:capture.id,status:capture.status,headerHash:capture.headerHash,headerBytes:capture.headerBytes,
            bytes:capture.bytes,done:capture.done,readerAcquired:capture.readerAcquired,readCalls:capture.readCalls,
            pending:capture.pending,error:capture.error,taken:capture.taken}
        },
        counts():BrowserCaptureOwnership{
          return {started:this.started,settled:this.settled,pending:this.pending.size,retainedBytes:this.retainedBytes,observerErrors:this.observerErrors}
        },
      }
      const control:BrowserCaptureControl={
        snapshot(){return {sequence:observation.sequence,omitted:observation.omitted,reads:observation.reads.map(value=>({...value}))}},
        metadata(id){const capture=captures.get(id);return capture?work.metadata(capture):null},
        take(id){
          const capture=captures.get(id)
          if(!capture||capture.error||!capture.done||capture.pending!==0||capture.taken)return null
          const data=new Uint8Array(capture.bytes);let offset=0
          for(const chunk of capture.chunks){data.set(chunk,offset);offset+=chunk.byteLength}
          capture.chunks=[];work.retainedBytes-=capture.bytes;capture.taken=true
          return {metadata:work.metadata(capture),bytes:Array.from(data)}
        },
        async drain(){
          while(work.pending.size)await Promise.allSettled([...work.pending])
          return work.counts()
        },
        release(){
          if(work.pending.size!==0)throw Error('native_browser_observer_not_drained')
          for(const capture of captures.values())capture.chunks=[]
          captures.clear();work.retainedBytes=0
          return work.counts()
        },
      }
      ;(window as unknown as {acceptedStoreReadObservation:BrowserCaptureControl}).acceptedStoreReadObservation=control
      window.fetch=(input,init)=>{
        let tracked=false
        try{tracked=new URL(typeof input==='string'?input:input instanceof Request?input.url:input.toString(),location.href).pathname==='/api/readiness/accepted-store'}catch{}
        if(!tracked)return original(input,init)
        const entry:BrowserFetchObservation={sequence:++observation.sequence,startedAt:performance.now(),
          headersAt:null,fetchSettledAt:null,abortedAt:null,status:null,bodyUsedAtAbort:null,bodyLockedAtAbort:null,abortDom:null,fetchError:null,observerError:false}
        observation.reads.push(entry)
        if(observation.reads.length>32){observation.reads.shift();observation.omitted++}
        const signal=init?.signal??(input instanceof Request?input.signal:null)
        let response:Response|null=null
        // Object methods have no external esbuild keepNames helper binding
        // when Playwright serializes this callback with Function.toString().
        const aborted={handleEvent(){
          entry.abortedAt=performance.now();entry.bodyUsedAtAbort=response?.bodyUsed??null;entry.bodyLockedAtAbort=response?.body?.locked??null
          const workspace=document.querySelector('[data-native-workspace]')
          entry.abortDom={status:workspace?.getAttribute('data-store-status')??null,busy:workspace?.getAttribute('data-store-busy')??null,
            visibility:document.visibilityState}
        }}
        if(signal?.aborted)aborted.handleEvent();else signal?.addEventListener('abort',aborted,{once:true})
        const originalPromise=original(input,init)
        work.own(originalPromise.then(value=>{
          response=value;entry.headersAt=performance.now();entry.fetchSettledAt=entry.headersAt;entry.status=value.status
          const id=value.headers.get('x-jetnity-fixture-read'),hash=value.headers.get('x-jetnity-fixture-body-sha256'),length=value.headers.get('x-jetnity-fixture-body-bytes')
          if(!id||!/^accepted-read-[1-9][0-9]{0,4}$/.test(id)||!hash||hash.length!==64||!/^[a-f0-9]{64}$/.test(hash)
            ||!length||!/^[0-9]{1,7}$/.test(length)||Number(length)>limit||captures.has(id)){
            entry.observerError=true;work.observerErrors++;return
          }
          // Retain only bounded evidence. A pending capture is never evicted
          // to make room for a newer or held response.
          if(captures.size>=32){
            const oldest=[...captures.entries()].find(([,candidate])=>candidate.pending===0&&(candidate.taken||candidate.error!==null))
            if(!oldest){entry.observerError=true;work.observerErrors++;return}
            const [key,candidate]=oldest
            if(!candidate.taken)work.retainedBytes-=candidate.bytes
            candidate.chunks=[];candidate.taken=true;captures.delete(key)
          }
          const capture:BrowserCaptureMetadata&{chunks:Uint8Array[]}={id,status:value.status,headerHash:hash,headerBytes:Number(length),
            bytes:0,done:false,readerAcquired:false,readCalls:0,pending:0,error:null,taken:false,chunks:[]}
          captures.set(id,capture)
          if(!value.body){capture.error='missing_body';return}
          const originalGetReader=value.body.getReader
          Object.defineProperty(value.body,'getReader',{configurable:true,value(this:ReadableStream<Uint8Array>,...args:unknown[]){
            const reader=Reflect.apply(originalGetReader,this,args) as ReadableStreamDefaultReader<Uint8Array>
            try {
              if(capture.readerAcquired){capture.error='multiple_readers';return reader}
              capture.readerAcquired=true
              const originalRead=reader.read
              Object.defineProperty(reader,'read',{configurable:true,value(this:ReadableStreamDefaultReader<Uint8Array>,...readArgs:unknown[]){
                capture.readCalls++
                let originalReadPromise:Promise<ReadableStreamReadResult<Uint8Array>>
                try {originalReadPromise=Reflect.apply(originalRead,this,readArgs) as Promise<ReadableStreamReadResult<Uint8Array>>}
                catch(error){capture.error='read_failed';throw error}
                work.own(originalReadPromise.then(part=>{
                  if(capture.error||capture.taken)return
                  if(part.done){capture.done=true;return}
                  if(!(part.value instanceof Uint8Array)){capture.error='invalid_chunk';return}
                  const bytes=part.value.byteLength
                  if(capture.bytes+bytes>limit||work.retainedBytes+bytes>limit){capture.error='bound';return}
                  if(bytes>0)capture.chunks.push(part.value.slice())
                  capture.bytes+=bytes;work.retainedBytes+=bytes
                },()=>{capture.error='read_failed'}),entry,capture)
                return originalReadPromise
              }})
            } catch {capture.error='observer';entry.observerError=true;work.observerErrors++}
            return reader
          }})
        },error=>{
          entry.fetchSettledAt=performance.now();entry.fetchError=error instanceof DOMException&&error.name==='AbortError'?'abort':error instanceof TypeError?'type':'other'
        }),entry)
        return originalPromise
      }
    })
    const positives=page.locator('[data-official-result="required"], [data-official-result="not_required"], [data-official-result="conditional"]')
    const none=async()=>{assert.equal(await positives.count(),0)}
    const read=async()=>{
      const observation:ReadAttemptObservation={action:++readAction,startedAt:performance.now(),requestAt:null,requestCount:0,responseAt:null,status:null,
        finishedAt:null,failedAt:null,requestFailure:null,bodyStartedAt:null,bodySettledAt:null,bodyOutcome:null,failureTag:null,
        ownedStarted:0,ownedSettled:0,browser:null,diagnosticUnavailable:false,capture:null,observerDrain:null}
      lastReadObservation=observation
      const owned:Promise<unknown>[]=[],failures:unknown[]=[]
      const own=<T>(pending:Promise<T>):Promise<T>=>{owned.push(pending);observation.ownedStarted++;void pending.then(
        ()=>{observation.ownedSettled++},()=>{observation.ownedSettled++});return pending}
      let expected:PlaywrightRequest|null=null,bodyStarted=false,waitSettled=false,result:AcceptedStoreTripResult|null=null
      let resolveWait!:(value:{response:PlaywrightResponse;body:AcceptedStoreTripResult})=>void,rejectWait!:(reason:unknown)=>void
      const pending=own(new Promise<{response:PlaywrightResponse;body:AcceptedStoreTripResult}>((resolve,reject)=>{resolveWait=resolve;rejectWait=reject}))
      const reject=(reason:unknown)=>{if(!waitSettled){waitSettled=true;rejectWait(reason)}}
      const timer=setTimeout(()=>reject(Error('native_browser_response_timeout')),45_000)
      const matching=(request:PlaywrightRequest)=>new URL(request.url()).pathname==='/api/readiness/accepted-store'&&request.method()==='POST'
      const requestStarted=(request:PlaywrightRequest)=>{
        if(!matching(request))return
        observation.requestCount++
        if(observation.requestCount>1){
          const failure=Error('native_browser_ambiguous_read');failures.push(failure);reject(failure);return
        }
        if(!expected){expected=request;observation.requestAt=performance.now()}
      }
      const requestFinished=(request:PlaywrightRequest)=>{if(request===expected)observation.finishedAt=performance.now()}
      const requestFailed=(request:PlaywrightRequest)=>{
        if(request!==expected)return
        observation.failedAt=performance.now()
        const reason=request.failure()?.errorText
        observation.requestFailure=typeof reason==='string'&&/^net::ERR_[A-Z0-9_]{1,64}$/.test(reason)?reason:'other_request_failure'
        if(!bodyStarted)reject(Error('native_browser_request_failed'))
      }
      const responseArrived=(response:PlaywrightResponse)=>{
        if(response.request()!==expected||bodyStarted||waitSettled)return
        bodyStarted=true;observation.responseAt=performance.now();observation.status=response.status();observation.bodyStartedAt=performance.now()
        // Always use the bytes consumed by the real hook's native reader. CDP
        // response-body retention after the hook's finally-abort is not a
        // second transport requirement and is never used as a fallback.
        const body=own((async()=>{
          const headers=response.headers(),id=headers['x-jetnity-fixture-read'],hash=headers['x-jetnity-fixture-body-sha256']
          const size=Number(headers['x-jetnity-fixture-body-bytes'])
          assert(typeof id==='string'&&/^accepted-read-[1-9][0-9]{0,4}$/.test(id))
          assert(typeof hash==='string'&&hash.length===64&&/^[a-f0-9]{64}$/.test(hash))
          assert(Number.isSafeInteger(size)&&size>=0&&size<=2*1024*1024)
          const sent=sentBodies.get(id);assert(sent&&sent.sent)
          assert.equal(sent.id,id);assert.equal(sent.status,response.status());assert.equal(sent.sha256,hash);assert.equal(sent.bytes,size)
          const remaining=45_000-(performance.now()-observation.startedAt)
          if(remaining<=0)throw Error('native_browser_response_timeout')
          const ready=await page.waitForFunction(responseId=>{
            const capture=(window as unknown as {acceptedStoreReadObservation:BrowserCaptureControl}).acceptedStoreReadObservation.metadata(responseId)
            return capture!==null&&(capture.error!==null||capture.done&&capture.pending===0)
          },id,{timeout:remaining})
          let captured:{metadata:BrowserCaptureMetadata;bytes:number[]}|null
          try {
            const metadata=await page.evaluate(responseId=>(window as unknown as {acceptedStoreReadObservation:BrowserCaptureControl}).acceptedStoreReadObservation.metadata(responseId),id)
            assert(metadata,'The exact native response must have a reader capture')
            assert.equal(metadata.error,null);assert.equal(metadata.done,true);assert.equal(metadata.readerAcquired,true);assert.equal(metadata.pending,0)
            captured=await page.evaluate(responseId=>(window as unknown as {acceptedStoreReadObservation:BrowserCaptureControl}).acceptedStoreReadObservation.take(responseId),id)
          } finally {await ready.dispose()}
          assert(captured,'The exact complete capture is consumed once; no earlier response supplies bytes')
          const bytes=Buffer.from(captured.bytes),actualHash=createHash('sha256').update(bytes).digest('hex')
          assert.equal(captured.metadata.id,id);assert.equal(captured.metadata.status,response.status())
          assert.equal(captured.metadata.headerHash,hash);assert.equal(captured.metadata.headerBytes,size)
          assert.equal(captured.metadata.bytes,size);assert.equal(bytes.byteLength,size);assert.equal(actualHash,hash)
          observation.capture={...captured.metadata,sha256:actualHash}
          const value=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes)) as AcceptedStoreTripResult
          observation.observerDrain=await page.evaluate(()=>(window as unknown as {acceptedStoreReadObservation:BrowserCaptureControl}).acceptedStoreReadObservation.drain())
          assert.equal(observation.observerDrain.pending,0);assert.equal(observation.observerDrain.started,observation.observerDrain.settled)
          assert.equal(observation.observerDrain.observerErrors,0)
          return value
        })())
        own(body.then(value=>{
          observation.bodySettledAt=performance.now();observation.bodyOutcome='fulfilled'
          if(!waitSettled){waitSettled=true;resolveWait({response,body:value})}
        },error=>{
          observation.bodySettledAt=performance.now();observation.bodyOutcome='rejected';observation.failureTag='observed_body_failed'
          reject(error)
        }))
      }
      const pageClosed=()=>reject(failures[0]??Error('native_browser_page_closed'))
      page.on('request',requestStarted);page.on('response',responseArrived);page.on('requestfinished',requestFinished);page.on('requestfailed',requestFailed);page.on('close',pageClosed)
      try {
        await own(page.getByRole('button',{name:'Gespeicherte Einreiseprüfung erneut prüfen',exact:true}).click())
        const {response,body}=await pending
        assert.equal(response.status(),200);assert.equal(body.status,'current',JSON.stringify({status:body.status,lastRpc:protocol!.evidence.slice(-6)}))
        // Same actual validator/current mounted Trip; observations only append
        // bounded metadata to the existing evaluation, without a new barrier.
        const inspected=await page.evaluate((value:unknown)=>({client:window.acceptedStoreFixture!.inspect(value),
          observation:(window as unknown as {acceptedStoreReadObservation:BrowserCaptureControl}).acceptedStoreReadObservation.snapshot()}),body)
        observation.browser=inspected.observation
        lastClientObservation={received:inspected.client,failure:null,dom:null}
        assert.equal(lastClientObservation.received.validation.ok,true,JSON.stringify(lastClientObservation.received))
        try {
          await page.waitForFunction(()=>document.querySelector('[data-native-workspace]')?.getAttribute('data-store-status')==='current')
        }catch(error){
          if(!failures.includes(error))failures.push(error)
          lastClientObservation.failure=await page.evaluate((value:unknown)=>window.acceptedStoreFixture!.inspect(value),body)
          lastClientObservation.dom=await page.evaluate(()=>{
            const workspace=document.querySelector('[data-native-workspace]')
            return {status:workspace?.getAttribute('data-store-status')??null,busy:workspace?.getAttribute('data-store-busy')??null,
              draftBlocked:workspace?.getAttribute('data-draft-blocked')??null,
              positiveCount:document.querySelectorAll('[data-official-result="required"], [data-official-result="not_required"], [data-official-result="conditional"]').length,
              visibility:document.visibilityState,wallNow:Date.now(),monotonicNow:performance.now()}
          })
          throw error
        }
        assert.equal(await positives.count(),1);assert(body.sourceCheckedAt&&body.expiresAt)
        assert.equal(observation.requestCount,1)
        result=body
      }catch(error){
        if(!failures.includes(error))failures.push(error)
        observation.failureTag??=bodyStarted?'validation_or_display_failed':'click_or_response_failed'
        try{observation.browser=await page.evaluate(()=>(window as unknown as {acceptedStoreReadObservation:BrowserCaptureControl}).acceptedStoreReadObservation.snapshot())}
        catch(diagnosticError){observation.diagnosticUnavailable=true;failures.push(diagnosticError)}
        // Request observer drain before closing; page termination owns any
        // still-pending native reads. The evaluate promise is itself owned and
        // may honestly reject if its execution context closes before drain.
        own(page.evaluate(()=>(window as unknown as {acceptedStoreReadObservation:BrowserCaptureControl}).acceptedStoreReadObservation.drain()))
        try{await page.close()}catch(closeError){failures.push(closeError)}
      }finally{
        clearTimeout(timer)
        page.off('request',requestStarted);page.off('response',responseArrived);page.off('requestfinished',requestFinished);page.off('requestfailed',requestFailed);page.off('close',pageClosed)
        if(!waitSettled)reject(failures[0]??Error('native_browser_read_stopped'))
        for(const drained of await Promise.allSettled(owned))if(drained.status==='rejected'&&!failures.includes(drained.reason))failures.push(drained.reason)
      }
      if(failures.length)throw failures.length===1?failures[0]:new AggregateError(failures,'native_browser_read_failed')
      if(!result)throw Error('native_browser_read_missing_result')
      return result
    }
    const confirm=async()=>{assert(sql(`update public.trip_traveller_documents set expires_on=expires_on+1
      where trip_id=${quote(trip.id)} and client_ref='synthetic-national-id' returning id`))
      trip=await declareNativeTrip(protocol!,runtime);await page.evaluate(value=>window.acceptedStoreFixture!.replaceTrip(value),trip)}
    const redraw=()=>page.evaluate(()=>window.acceptedStoreFixture!.redraw())
    stage='closed initial mount'
    const scriptResponse=page.waitForResponse(response=>new URL(response.url()).pathname==='/bundle.js')
    const [documentLoad,scriptLoad]=await Promise.allSettled([page.goto(origin),scriptResponse])
    if(documentLoad.status==='rejected')throw documentLoad.reason
    if(scriptLoad.status==='rejected')throw scriptLoad.reason
    const documentResponse=documentLoad.value;assert(documentResponse)
    assert.equal(documentResponse.headers()['content-type'],'text/html; charset=utf-8')
    const loadedScript=scriptLoad.value;assert.equal(loadedScript.status(),200)
    assert.equal(loadedScript.headers()['content-type'],'text/javascript; charset=utf-8')
    const documentCharset=await page.evaluate(()=>document.characterSet);assert.equal(documentCharset,'UTF-8')
    await page.waitForFunction(()=>!!window.acceptedStoreFixture)
    await none();assert.equal(storeRequests,0);assert.equal(await page.evaluate(()=>window.acceptedStoreFixture!.read()),false);assert.equal(storeRequests,0)
    assert(await page.getByRole('button',{name:'Gespeicherte Einreiseprüfung erneut prüfen',exact:true}).isDisabled());proofs.push(stage)
    await page.evaluate(()=>window.acceptedStoreFixture!.available(true))
    stage='actual native result in unchanged preparation renderer'
    const first=await read();assert.equal(first.receiptFingerprint,published.status==='confirmed'?published.receipt:null)
    assert(await page.getByText('SYNTHETIC LOCAL TEST ONLY',{exact:false}).count()>0)
    assert.equal(state.sourceStarts,sourceStarts);proofs.push(stage)

    stage='real traveller buttons synchronously invalidate without persistence'
    const selectedCard=page.locator('[data-preparation-traveller="synthetic-traveller"]')
    const otherCard=page.locator('[data-preparation-traveller="synthetic-other"]')
    const saveCard=async(card:typeof selectedCard)=>{
      const beforeWrites=travellerWrites
      const saved=page.waitForResponse(response=>new URL(response.url()).pathname==='/fixture/traveller'&&response.request().method()==='POST')
      await card.getByRole('button',{name:'Angaben speichern',exact:true}).click()
      assert.equal((await saved).status(),200)
      await page.waitForFunction(ref=>document.querySelector(`[data-preparation-traveller="${ref}"]`)?.getAttribute('data-traveller-phase')==='consistent',
        await card.getAttribute('data-preparation-traveller'))
      assert.equal(travellerWrites,beforeWrites+1)
      assert.equal(await page.locator('[data-native-workspace]').getAttribute('data-draft-blocked'),'false')
    }
    await selectedCard.locator('summary').click();assert.equal(await positives.count(),1);assert.equal(travellerWrites,0)
    const passportRow=selectedCard.locator('fieldset > div').filter({has:page.locator('option[value="passport"]:checked')})
    assert.equal(await passportRow.count(),1)
    await passportRow.getByRole('button',{name:'Dokument entfernen',exact:true}).click();await none()
    assert.equal(travellerWrites,0);assert.equal(await page.locator('[data-native-read-controls]').count(),0)
    assert.equal(await selectedCard.getByRole('combobox',{name:'Dokument 1',exact:true}).inputValue(),'national_id');proofs.push(stage)

    stage='retained unsaved draft blocks newer confirmed Trip and genuine fresh native result'
    await confirm();assert.equal(travellerWrites,0);await none()
    assert.equal(await page.locator('[data-native-workspace]').getAttribute('data-draft-blocked'),'true')
    assert.equal(await page.locator('[data-native-read-controls]').count(),0)
    const retainedResultCount=results.length
    // Test-only direct invocation of the ACTUAL hook proves the same render
    // guard even if fresh real native bytes become available behind the absent
    // user control. No positive result/evaluator is supplied to the component.
    assert.equal(await page.evaluate(()=>window.acceptedStoreFixture!.read()),true)
    assert(results.length>retainedResultCount);assert.equal(results.at(-1)?.status,'current')
    await redraw();await none();assert.equal(await page.locator('[data-native-read-controls]').count(),0)
    assert.equal(await selectedCard.getByRole('combobox',{name:'Dokument 1',exact:true}).inputValue(),'national_id');proofs.push(stage)

    stage='actual reload editing save and matching native re-read recover'
    await selectedCard.getByRole('button',{name:'Neu laden',exact:true}).click();await none()
    const nationalRow=selectedCard.locator('fieldset > div').filter({has:page.locator('option[value="national_id"]:checked')})
    await nationalRow.getByLabel('Ablaufdatum, falls bekannt',{exact:true}).fill('2032-12-31')
    await none();await saveCard(selectedCard);await read();proofs.push(stage)

    stage='actual document and citizenship add remove preserve save recovery'
    let writes=travellerWrites
    await selectedCard.getByRole('button',{name:'Weiteres Dokument',exact:true}).click();await none()
    assert.equal(travellerWrites,writes);assert.equal(await page.locator('[data-native-read-controls]').count(),0)
    await saveCard(selectedCard);await read()
    writes=travellerWrites
    await otherCard.locator('summary').click();assert.equal(await positives.count(),1)
    await otherCard.getByRole('button',{name:'Entfernen',exact:true}).last().click();await none()
    assert.equal(travellerWrites,writes);await saveCard(otherCard);await read()
    writes=travellerWrites
    await selectedCard.getByRole('button',{name:'Weitere Staatsbürgerschaft',exact:true}).click();await none()
    assert.equal(travellerWrites,writes)
    await selectedCard.getByRole('button',{name:'Entfernen',exact:true}).last().click();await none()
    assert.equal(travellerWrites,writes);await saveCard(selectedCard);await read();proofs.push(stage)

    stage='local edit and confirmed fresh read independent of pilot invalid latch'
    await page.getByRole('button',{name:'Local edit',exact:true}).click();await none()
    assert(await page.getByRole('button',{name:'Gespeicherte Einreiseprüfung erneut prüfen',exact:true}).isDisabled())
    await confirm();const refreshed=await read();assert(refreshed.revision>first.revision);assert.equal(refreshed.sourceCheckedAt,first.sourceCheckedAt)
    assert.equal(await page.locator('[data-proof-pilot-positive]').getAttribute('data-proof-pilot-positive'),'0');proofs.push(stage)

    stage='loss of availability and context cannot revive old positive'
    const before=storeRequests;await page.evaluate(()=>window.acceptedStoreFixture!.available(false));await none()
    await page.evaluate(()=>window.acceptedStoreFixture!.available(true));await redraw();await none();assert.equal(storeRequests,before)
    await read();await page.evaluate(value=>window.acceptedStoreFixture!.replaceTrip({...value,endDate:'2026-11-26'}),trip);await none()
    await page.evaluate(value=>window.acceptedStoreFixture!.replaceTrip(value),trip);await redraw();await none();await read();proofs.push(stage)

    // Transport-only hold AFTER receiving the genuine fresh native HTTP body.
    // It deliberately permits late delivery after abort to prove generation
    // suppression; it never substitutes an accepted DTO or SQL outcome.
    await page.evaluate(()=>{
      const original=window.fetch.bind(window)
      const state={next:false,held:false,release(){},realNow:Date.now.bind(Date)}
      ;(window as unknown as {acceptedTransport:typeof state}).acceptedTransport=state
      window.fetch=async(input,init)=>{
        const response=await original(input,init)
        if(state.next&&String(input).includes('/api/readiness/accepted-store')){
          state.next=false;const body=await response.arrayBuffer();state.held=true
          await new Promise<void>(resolve=>{state.release=resolve})
          state.held=false;return new Response(body,{status:response.status,headers:response.headers})
        }
        return response
      }
    })
    const hold=async()=>{
      await page.evaluate(()=>{(window as unknown as {acceptedTransport:{next:boolean}}).acceptedTransport.next=true})
      await page.getByRole('button',{name:'Gespeicherte Einreiseprüfung erneut prüfen',exact:true}).click()
      await page.waitForFunction(()=>(window as unknown as {acceptedTransport:{held:boolean}}).acceptedTransport.held)
    }
    const release=()=>page.evaluate(()=>{(window as unknown as {acceptedTransport:{release:()=>void}}).acceptedTransport.release()})
    stage='out-of-order native reply after edit and newer confirmed read'
    await hold();await page.getByRole('button',{name:'Local edit',exact:true}).click();await none();await confirm()
    const newer=await read();await release();await redraw();assert.equal(await positives.count(),1)
    assert.equal(await page.locator('[data-native-workspace]').getAttribute('data-store-status'),'current');assert.equal(newer.revision,trip.revision);proofs.push(stage)

    stage='irreversible wall-clock expiry and regression in current and pending attempts'
    for(const offset of [120_000,-60_000]){
      await page.evaluate(value=>{const state=(window as unknown as {acceptedTransport:{realNow:()=>number}}).acceptedTransport;Date.now=()=>state.realNow()+value;window.acceptedStoreFixture!.redraw()},offset)
      await none()
      await page.evaluate(()=>{Date.now=(window as unknown as {acceptedTransport:{realNow:()=>number}}).acceptedTransport.realNow;window.acceptedStoreFixture!.redraw()})
      await none();await read()
    }
    await hold();await page.evaluate(()=>{const state=(window as unknown as {acceptedTransport:{realNow:()=>number}}).acceptedTransport;Date.now=()=>state.realNow()-60_000;window.acceptedStoreFixture!.redraw()})
    await none();await release();await page.evaluate(()=>{Date.now=(window as unknown as {acceptedTransport:{realNow:()=>number}}).acceptedTransport.realNow;window.acceptedStoreFixture!.redraw()});await none();proofs.push(stage)

    stage='pending hidden/pagehide resume suppresses late native reply and never auto-retries'
    await read();await hold();const visibilityRequests=storeRequests
    await page.evaluate(()=>{Object.defineProperty(document,'visibilityState',{configurable:true,value:'hidden'});document.dispatchEvent(new Event('visibilitychange'));window.dispatchEvent(new PageTransitionEvent('pagehide'))})
    await none();await page.evaluate(()=>{Object.defineProperty(document,'visibilityState',{configurable:true,value:'visible'});document.dispatchEvent(new Event('visibilitychange'));window.dispatchEvent(new PageTransitionEvent('pageshow'))})
    await release();await redraw();await none();assert.equal(storeRequests,visibilityRequests);proofs.push(stage)

    stage='latest lane owns pending results and failure without positive fallback'
    await read();pilotPending=true
    await page.getByRole('button',{name:'Existing pilot intent',exact:true}).click();await none()
    await page.waitForFunction(()=>document.querySelector('[data-native-workspace]')?.getAttribute('data-pilot-status')==='checking')
    await read();assert.equal(await positives.count(),1)
    pilotPending=false;for(const done of pendingPilots)done();await redraw();assert.equal(await positives.count(),1)
    await page.getByRole('button',{name:'Existing pilot intent',exact:true}).click();await none()
    await page.waitForFunction(()=>document.querySelector('[data-native-workspace]')?.getAttribute('data-pilot-status')==='unavailable');await none()
    // Reciprocal pending race: the held bytes are a genuine native CURRENT
    // reply, but a later pilot intent owns the display before their delivery.
    await read();await hold();pilotPending=true
    await page.getByRole('button',{name:'Existing pilot intent',exact:true}).click();await none()
    await page.waitForFunction(()=>document.querySelector('[data-native-workspace]')?.getAttribute('data-pilot-status')==='checking')
    await release();await redraw();await none()
    pilotPending=false;for(const done of pendingPilots)done()
    await page.waitForFunction(()=>document.querySelector('[data-native-workspace]')?.getAttribute('data-pilot-status')==='unavailable');await redraw();await none()
    await read();storeFailure=true
    await page.getByRole('button',{name:'Gespeicherte Einreiseprüfung erneut prüfen',exact:true}).click()
    await page.waitForFunction(()=>document.querySelector('[data-native-workspace]')?.getAttribute('data-store-status')==='unavailable');await none();storeFailure=false;proofs.push(stage)

    stage='original monotonic deadline survives rerenders and expires'
    const expiring=await read(),received=performance.now();await redraw();await redraw()
    await page.waitForFunction(()=>!document.querySelector('[data-official-result="required"], [data-official-result="not_required"], [data-official-result="conditional"]'),undefined,{timeout:17_000})
    assert(performance.now()-received<=17_000);await redraw();await none();proofs.push(stage)
    assert.equal(state.sourceStarts,sourceStarts);assert.deepEqual(errors,[]);assert.deepEqual(outbound,[])
    const observerOwnership=await page.evaluate(async()=>{
      const capture=(window as unknown as {acceptedStoreReadObservation:BrowserCaptureControl}).acceptedStoreReadObservation
      await capture.drain();return capture.release()
    })
    assert.equal(observerOwnership.pending,0);assert.equal(observerOwnership.started,observerOwnership.settled)
    assert.equal(observerOwnership.retainedBytes,0);assert.equal(observerOwnership.observerErrors,0)
    t.diagnostic(JSON.stringify({proof:'actual-native-mounted-workspace',node:process.versions.node,react:'19.2.8',playwright:'1.55.0',browser:browser.version(),binaryVersion,
      actualModules:['components/trips/useAcceptedStoreTrip.ts','components/trips/useOfficialTruthPilot.ts','components/trips/Reisevorbereitung.tsx'],
      bundleSha256:bundle.sha256,bundleModules:bundle.modules,repoModules:bundle.files.length,documentCharset,proofs,
      storeRequests,pilotRequests,travellerWrites,observerOwnership,nativeCurrentResults:results.filter(value=>value.status==='current').length,sourceFetchesDuringReads:0,
      sourceCheckedAt:expiring.sourceCheckedAt,readAt:expiring.readAt,expiresAt:expiring.expiresAt,deadlineFromRequestStartMs:expiring.deadlineFromRequestStartMs,
      boundary:'Closed native DB + actual hook/lane/presentation mount. Existing pilot is negative transport only; no full hosted Next/managed Auth/origin claim.'}))
    await context.close()
  } catch(error){t.diagnostic(JSON.stringify({failedBrowserStage:stage,proofs,storeRequests,pilotRequests,errors,outbound,lastNativeStatus:results.at(-1)?.status,
    lastClientObservation,lastReadObservation,lastRpcOutcomes:protocol?.evidence.slice(-8)}));throw error}
  finally {
    for(const done of pendingPilots)done();if(browser)await browser.close()
    if(server){server.closeAllConnections();await new Promise<void>(resolve=>server!.close(()=>resolve()))}
    while(active.size)await Promise.allSettled([...active])
    if(protocol){await protocol.settle();await protocol.close()}if(witness)await witness.close()
    for(const key of envKeys){if(previous[key]===undefined)delete process.env[key];else process.env[key]=previous[key]}
    cluster.stop()
  }
}
