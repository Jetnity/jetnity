/** Required mounted browser proof fed by genuine fresh native DB read results.
 * No positive DTO, provider evaluation, hook or presentation module is replaced. */
import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import { createServer,type IncomingMessage,type ServerResponse } from 'node:http'
import { existsSync,readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { chromium } from 'playwright'
import { startLocalProofCluster,assertLocalProofEnvironment } from '../official-truth-integrated-pilot-1/local-cluster'
import { nativeSql,installNativeSchema,quote } from './native-schema'
import { startNativeHttp } from './native-http'
import { nativeProductRuntime,type NativeRuntimeState } from './native-loader'
import { seedNativeRows,seedNativeCatalog,nativeBinding,declareNativeTrip,nativeIds } from './native-fixture'
import { nativeBrowserBundle } from './browser-bundle'
import { travellerKontoEingabeSchema } from '@/lib/readiness/schema'
import { travellerAlsPayload,travellerBauen } from '@/lib/readiness/reisende'
import { pgText } from '../official-truth-integrated-pilot-1/pg-wire'
import type {} from './browser-entry'
import type { AcceptedStoreTripResult } from '@/lib/readiness/official-truth-accepted-store-trip-integration-1/result'

export async function mountedAcceptedStoreProof(t:TestContext){
  assert.equal(process.versions.node.split('.')[0],'22');assertLocalProofEnvironment()
  for(const [name,version] of [['react','19.2.8'],['react-dom','19.2.8'],['playwright','1.55.0']])
    assert.equal(JSON.parse(readFileSync(`node_modules/${name}/package.json`,'utf8')).version,version)
  const executablePath=['/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'].find(existsSync)
  assert(executablePath,'Required installed system browser; no download or optional skip')
  const binaryVersion=execFileSync(executablePath,['--version'],{encoding:'utf8',timeout:5_000}).trim()
  const bundle=nativeBrowserBundle(),cluster=startLocalProofCluster(),sql=nativeSql(cluster)
  let protocol:Awaited<ReturnType<typeof startNativeHttp>>|null=null,witness:Awaited<ReturnType<typeof nativeBinding>>|null=null
  let browser:Awaited<ReturnType<typeof chromium.launch>>|null=null,server:ReturnType<typeof createServer>|null=null
  const envKeys=['NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_ANON_KEY','SUPABASE_SERVICE_ROLE_KEY'] as const
  const previous=Object.fromEntries(envKeys.map(key=>[key,process.env[key]]))
  const active=new Set<Promise<void>>(),pendingPilots=new Set<()=>void>(),errors:string[]=[],outbound:string[]=[],proofs:string[]=[]
  let stage='bootstrap',storeRequests=0,pilotRequests=0,travellerWrites=0,pilotPending=false,storeFailure=false,origin=''
  const results:AcceptedStoreTripResult[]=[]
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
      if(req.url==='/'&&req.method==='GET'){res.writeHead(200,{'content-type':'text/html','cache-control':'no-store'});res.end('<!doctype html><html lang="de"><body><div id="root"></div><script src="/bundle.js"></script></body></html>');return}
      if(req.url==='/bundle.js'){res.writeHead(200,{'content-type':'text/javascript','cache-control':'no-store'});res.end(bundle.code);return}
      if(req.url==='/api/readiness/ch-de-application'){
        pilotRequests++
        if(pilotPending)await new Promise<void>(resolve=>{const done=()=>{pendingPilots.delete(done);resolve()};pendingPilots.add(done);controller.signal.addEventListener('abort',done,{once:true})})
        // Only an unavailable old-pilot transport is simulated. No positive
        // pilot DTO, capability, source response or legal result is invented.
        send(res,503,{message:'Closed fixture pilot transport unavailable'});return
      }
      if(req.url==='/api/readiness/accepted-store'&&req.method==='POST'){
        storeRequests++;if(storeFailure){send(res,503,{message:'Closed fixture transport failure'});return}
        const parts:Buffer[]=[];let bytes=0
        for await(const chunk of req){bytes+=(chunk as Buffer).length;assert(bytes<=8192);parts.push(Buffer.from(chunk))}
        runtime.rate.readinessRateLeeren()
        const request=new Request(`${origin}${req.url}`,{method:'POST',signal:controller.signal,
          headers:{origin:req.headers.origin??'','content-type':String(req.headers['content-type']??''),'sec-fetch-site':String(req.headers['sec-fetch-site']??'')},
          body:Buffer.concat(parts).toString('utf8')})
        const response=await runtime.request.acceptedStoreTripRequest(request)
        if(response.status===200&&typeof response.body==='object'&&response.body!==null&&'status'in response.body)results.push(response.body as AcceptedStoreTripResult)
        send(res,response.status,response.body);return
      }
      send(res,404,{message:'Closed fixture endpoint'})
    }
    server=createServer((req,res)=>{const pending=handle(req,res).catch(error=>{errors.push(`fixture:${error instanceof Error?error.message:'unknown'}`);send(res,500,{message:'fixture failure'})}).finally(()=>active.delete(pending));active.add(pending)})
    await new Promise<void>(resolve=>server!.listen(0,'127.0.0.1',resolve));const address=server.address();assert(address&&typeof address==='object');origin=`http://127.0.0.1:${address.port}`
    browser=await chromium.launch({executablePath,headless:true})
    assert(binaryVersion.includes(browser.version()),'Recorded launch target must be the actual running system browser')
    const context=await browser.newContext({viewport:{width:1280,height:900},reducedMotion:'reduce'})
    await context.route('**/*',route=>{const url=new URL(route.request().url());if(url.origin!==origin){outbound.push(url.origin);return route.abort()}return route.continue()})
    const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));page.setDefaultTimeout(45_000)
    const positives=page.locator('[data-official-result="required"], [data-official-result="not_required"], [data-official-result="conditional"]')
    const none=async()=>{assert.equal(await positives.count(),0)}
    const read=async()=>{
      const pending=page.waitForResponse(response=>new URL(response.url()).pathname==='/api/readiness/accepted-store'&&response.request().method()==='POST')
      await page.getByRole('button',{name:'Gespeicherte Einreiseprüfung erneut prüfen',exact:true}).click()
      const response=await pending,body=await response.json() as AcceptedStoreTripResult
      assert.equal(response.status(),200);assert.equal(body.status,'current',JSON.stringify({status:body.status,lastRpc:protocol!.evidence.slice(-6)}))
      await page.waitForFunction(()=>document.querySelector('[data-native-workspace]')?.getAttribute('data-store-status')==='current')
      assert.equal(await positives.count(),1);assert(body.sourceCheckedAt&&body.expiresAt)
      return body
    }
    const confirm=async()=>{assert(sql(`update public.trip_traveller_documents set expires_on=expires_on+1
      where trip_id=${quote(trip.id)} and client_ref='synthetic-national-id' returning id`))
      trip=await declareNativeTrip(protocol!,runtime);await page.evaluate(value=>window.acceptedStoreFixture!.replaceTrip(value),trip)}
    const redraw=()=>page.evaluate(()=>window.acceptedStoreFixture!.redraw())
    stage='closed initial mount'
    await page.goto(origin);await page.waitForFunction(()=>!!window.acceptedStoreFixture)
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
    assert.equal(await selectedCard.getByLabel('Dokument 1',{exact:true}).inputValue(),'national_id');proofs.push(stage)

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
    assert.equal(await selectedCard.getByLabel('Dokument 1',{exact:true}).inputValue(),'national_id');proofs.push(stage)

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
      const state={next:false,held:false,release:()=>{},realNow:Date.now.bind(Date)}
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
    t.diagnostic(JSON.stringify({proof:'actual-native-mounted-workspace',node:process.versions.node,react:'19.2.8',playwright:'1.55.0',browser:browser.version(),binaryVersion,
      actualModules:['components/trips/useAcceptedStoreTrip.ts','components/trips/useOfficialTruthPilot.ts','components/trips/Reisevorbereitung.tsx'],
      bundleSha256:bundle.sha256,bundleModules:bundle.modules,repoModules:bundle.files.length,proofs,
      storeRequests,pilotRequests,travellerWrites,nativeCurrentResults:results.filter(value=>value.status==='current').length,sourceFetchesDuringReads:0,
      sourceCheckedAt:expiring.sourceCheckedAt,readAt:expiring.readAt,expiresAt:expiring.expiresAt,deadlineFromRequestStartMs:expiring.deadlineFromRequestStartMs,
      boundary:'Closed native DB + actual hook/lane/presentation mount. Existing pilot is negative transport only; no full hosted Next/managed Auth/origin claim.'}))
    await context.close()
  } catch(error){t.diagnostic(JSON.stringify({failedBrowserStage:stage,proofs,storeRequests,pilotRequests,errors,outbound,lastNativeStatus:results.at(-1)?.status,lastRpcOutcomes:protocol?.evidence.slice(-8)}));throw error}
  finally {
    for(const done of pendingPilots)done();if(browser)await browser.close()
    if(server){server.closeAllConnections();await new Promise<void>(resolve=>server!.close(()=>resolve()))}
    while(active.size)await Promise.allSettled([...active])
    if(protocol){await protocol.settle();await protocol.close()}if(witness)await witness.close()
    for(const key of envKeys){if(previous[key]===undefined)delete process.env[key];else process.env[key]=previous[key]}
    cluster.stop()
  }
}
