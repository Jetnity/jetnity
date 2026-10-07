import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { createRequire } from 'node:module'
import { mkdirSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright'
import { createServerClient } from '@supabase/ssr'
const require=createRequire(import.meta.url),{fixture}=require('./fixture.ts'),{reiseAus}=require('../../lib/trips/abbildung.ts'),{aenderungAlsNutzlast}=require('../../lib/reiseaenderung/nutzlast.ts')
export async function accountBrowser({url,anon,db,outside,psql,accountPlanSchreiben,owner,control,traffic}) {
 const base=process.env.AUDIT_BASE||'http://127.0.0.1:3517',dir='docs/evidence/direct-trip-editing-1';mkdirSync(`${dir}/screens`,{recursive:true})
 assert(['127.0.0.1','localhost'].includes(new URL(base).hostname))
 psql("insert into public.places(id,source,source_id,name,typ) values ('geonames:2657896','geonames','2657896','Zürich','city'),('geonames:3176959','geonames','3176959','Florenz','city');")
 const source=fixture(),tripId=randomUUID(),stages=source.stages.map(s=>({...s,id:randomUUID()})),dayIds=source.days.map(()=>randomUUID()),itemIds=source.days.map(()=>randomUUID())
 const insert=async(table,row)=>assert.ifError((await db.from(table).insert(row)).error)
 await insert('trips',{id:tripId,title:source.title,origin:source.origin,origin_place_id:source.originPlaceId,start_date:source.startDate,end_date:source.endDate,currency:'CHF',budget_amount:1200,pace:'balanced',interests:['culture']})
 for(const s of stages)await insert('trip_stages',{id:s.id,trip_id:tripId,name:s.name,position:s.position,place_id:s.placeId,country_code:s.countryCode,latitude:s.latitude,longitude:s.longitude,arrival_date:s.arrivalDate,departure_date:s.departureDate})
 for(let i=0;i<4;i++){
  const stageId=stages[i<2?0:1].id,item=source.days[i].items[0]
  await insert('trip_days',{id:dayIds[i],trip_id:tripId,stage_id:stageId,day_index:i+1,day_date:source.days[i].dayDate})
  await insert('trip_items',{id:itemIds[i],trip_id:tripId,day_id:dayIds[i],stage_id:stageId,kind:item.kind,title:item.title,position:1,starts_on:item.startsOn,ends_on:item.endsOn,starts_at:item.startsAt,ends_at:item.endsAt,price_amount:item.priceAmount,price_currency:item.priceCurrency,booking_status:item.bookingStatus,booking_source:item.bookingSource,booking_confirmed_at:item.bookingConfirmedAt})
 }
 const read=async()=>{const r=await db.from('trips').select('*,trip_days(*),trip_stages(*),trip_items(*)').eq('id',tripId).single();assert.ifError(r.error);return r.data}
 const browser=await chromium.launch({headless:true,channel:'chrome'}),clients=[],results=[],errors=[],outbound=[]
 let page,step='open',failure,applyRequest
 const contractProbes=[]
 const ctxFor=async(client)=>{
  const ctx=await browser.newContext({viewport:{width:390,height:900},reducedMotion:'reduce'}),jar=new Map()
  if(client){const s=(await client.auth.getSession()).data.session;const ssr=createServerClient(url,anon,{cookies:{getAll:()=>[...jar.values()],setAll:v=>v.forEach(c=>jar.set(c.name,c))}});clients.push(ssr);assert.ifError((await ssr.auth.setSession({access_token:s.access_token,refresh_token:s.refresh_token})).error);await ctx.addCookies([...jar.values()].map(c=>({name:c.name,value:c.value,url:base,sameSite:'Lax'})))}
  await ctx.route('**/*',route=>{if(![base,url].includes(new URL(route.request().url()).origin)){outbound.push(new URL(route.request().url()).origin);return route.abort()}return route.continue()});return ctx
 }
 const check=async(name,fn)=>{step=name;await fn();results.push({name,status:'PASS'})}
 const open=async()=>{await page.getByRole('button',{name:'Reise ändern',exact:true}).click();await page.getByLabel('Reisetitel',{exact:true}).waitFor()}
 const preview=async()=>{const caught=page.waitForRequest(r=>r.method()==='POST'&&!!r.headers()['next-action']);await page.getByRole('button',{name:'Auswirkungen ansehen'}).click();await caught;await page.getByRole('heading',{name:'Auswirkungen prüfen',exact:true}).waitFor()}
 const save=async()=>{applyRequest=undefined;const caught=page.waitForRequest(r=>r.method()==='POST'&&!!r.headers()['next-action']);await page.getByRole('button',{name:'Änderung ausdrücklich übernehmen'}).click();applyRequest=await caught}
 const saved=()=>page.getByRole('heading',{name:'Änderung gespeichert und bestätigt',exact:true}).waitFor()
 const replay=async(context,request,payload)=>context.request.post(`${base}/reisen/${tripId}`,{headers:{'next-action':request.headers()['next-action'],'content-type':'text/plain;charset=UTF-8',origin:base},data:payload??request.postData()})
 try {
  const ctx=await ctxFor(db);page=await ctx.newPage();page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));await page.goto(`${base}/reisen/${tripId}`);await open()
  await check('Owner production route; model disabled; metadata preserves dates, bookings and canonical locations with catalog 503',async()=>{
   const before=await read();await page.getByLabel('Reisetitel',{exact:true}).fill('Account direkt bestätigt');await preview();assert.equal((await read()).revision,before.revision);await save();await saved();const after=await read();assert.equal(after.title,'Account direkt bestätigt');assert.equal(after.revision,before.revision+1);assert.equal(after.origin_place_id,before.origin_place_id)
   const clean=rows=>rows.map(row=>{const copy={...row};delete copy.updated_at;return copy}).sort((a,b)=>a.id.localeCompare(b.id));assert.deepEqual(clean(after.trip_items),clean(before.trip_items));assert.deepEqual(clean(after.trip_stages),clean(before.trip_stages));await page.reload();await open();assert.equal(await page.getByLabel('Reisetitel',{exact:true}).inputValue(),after.title)
  })
  await check('Second real owner and absent session cannot read or apply; action extras cannot import authority',async()=>{
   assert.deepEqual((await outside.from('trips').select('*').eq('id',tripId)).data,[])
   assert((await outside.rpc('reise_aendern',{_aenderung:{trip_id:tripId,mutation_id:'foreign-attempt',basis_revision:1}})).error)
   const before=await read(),req=applyRequest
   for(const actor of [outside,null]){const other=await ctxFor(actor);const r=await replay(other,req);assert(r.status()<500);assert.equal((await read()).revision,before.revision);await other.close()}
   const body=JSON.parse(req.postData());assert(Array.isArray(body));const forged=JSON.stringify([{...body[0],reise:{title:'Forged graph'},userId:owner}]);const r=await replay(ctx,req,forged);assert(r.status()<500);assert.equal((await read()).revision,before.revision)
  })
  await check('Native #903 child update invalidates an already accepted macro preview',async()=>{
   await page.getByLabel('Reisetitel',{exact:true}).fill('Stale macro must never save');await preview();const before=await read(),point=before.trip_items.find(x=>x.id===itemIds[0])
   await accountPlanSchreiben(db,owner,'bearbeiten',{tripId,itemId:point.id,expectedVersion:point.updated_at,aenderung:{art:'inhalt',dayId:point.day_id,inhalt:{kind:'note',title:point.title,note:'Concurrent #903 note',startsOn:point.starts_on,endsOn:point.ends_on,startsAt:point.starts_at.slice(0,5),endsAt:point.ends_at.slice(0,5)}}})
   assert.equal((await read()).revision,before.revision+1);
   const oldGraph=reiseAus(before,before.trip_stages,before.trip_days,before.trip_items);
   const staleSql=await db.rpc('reise_aendern',{_aenderung:aenderungAlsNutzlast(oldGraph,'stale-sql-boundary',before.revision)});assert.equal(staleSql.error?.code,'P0001');
   await save();await page.getByRole('alert').filter({hasText:/inzwischen geändert/}).waitFor();assert.equal((await read()).title,'Account direkt bestätigt');assert.equal((await read()).trip_items.find(x=>x.id===point.id).note,'Concurrent #903 note')
   await page.reload();await open()
  })
  await check('Lost RPC acknowledgement is confirmed independently; pending locks and duplicate click cannot double duration',async()=>{
   await page.getByLabel('Gesamtdauer in Tagen').fill('5');await preview();const before=await read(),rpcBefore=traffic.rpc;control({loseAck:true})
   let release,captured=false;const gate=new Promise(r=>release=r)
   await page.route(`**/reisen/${tripId}*`,async route=>{if(route.request().method()==='POST'&&route.request().headers()['next-action']){const response=await route.fetch();captured=true;await gate;return route.fulfill({response})}return route.continue()})
   await save();for(let n=0;n<200&&!captured;n++)await new Promise(r=>setTimeout(r,50));assert(captured)
   assert(await page.getByRole('button',{name:'Änderung ausdrücklich übernehmen'}).isDisabled());assert(await page.getByRole('button',{name:'In eigenen Worten',exact:true}).isDisabled());await page.keyboard.press('Escape');assert.equal(await page.getByRole('heading',{name:'Auswirkungen prüfen'}).count(),1)
   await page.screenshot({path:`${dir}/screens/account-pending.png`,fullPage:true});release();await saved();await page.unroute(`**/reisen/${tripId}*`);control({loseAck:false});const after=await read();assert.equal(after.revision,before.revision+1);assert.equal(after.trip_days.length,5);assert.equal(traffic.rpc,rpcBefore+1)
   await replay(ctx,applyRequest);assert.equal((await read()).revision,after.revision);assert.equal((await read()).trip_days.length,5)
   const body=JSON.parse(applyRequest.postData());body[0].eingabe={duration:6};await replay(ctx,applyRequest,JSON.stringify(body));assert.equal((await read()).revision,after.revision)
  })
  await check('Committed write with unavailable readback stays uncertain; same mutation verification recovers',async()=>{
   await page.getByRole('button',{name:'Weitere Änderung vorbereiten'}).click();await page.getByLabel('Reisetitel',{exact:true}).fill('Readback bestätigt erst später');await preview();const before=await read();control({afterWrite:true});await save()
   await page.getByRole('button',{name:'Ergebnis erneut prüfen'}).waitFor();assert.equal(await page.getByRole('heading',{name:'Änderung gespeichert und bestätigt'}).count(),0);assert(await page.getByRole('button',{name:'Zurück zur Eingabe'}).isDisabled());assert(await page.getByRole('button',{name:'In eigenen Worten',exact:true}).isDisabled());await page.screenshot({path:`${dir}/screens/account-uncertain.png`,fullPage:true})
   control({reads:false,afterWrite:false});assert.equal((await read()).revision,before.revision+1);const rpcBefore=traffic.rpc;await page.getByRole('button',{name:'Ergebnis erneut prüfen'}).click();await saved();assert.equal(traffic.rpc,rpcBefore);assert.equal((await read()).title,'Readback bestätigt erst später')
  })
  await check('Stage removal lists normal losses and protected unplanned preservation; real RPC/reload',async()=>{
   await page.getByRole('button',{name:'Weitere Änderung vorbereiten'}).click();await page.getByLabel('Dauer bearbeiten').selectOption('etappen');await page.getByLabel('Etappe 2 entfernen',{exact:true}).check();await preview()
   await page.locator('summary').filter({hasText:'Normale Planpunkte, die entfernt würden'}).click();await page.locator('[aria-label="Vollständige Auswirkungen"] li').filter({hasText:'Planpunkt 3'}).waitFor()
   const before=await read();await save();await saved();const after=await read();assert.equal(after.trip_stages.length,1);assert.equal(after.trip_days.length,2);assert(!after.trip_items.some(p=>p.id===itemIds[2]));const protectedBefore=before.trip_items.find(p=>p.id===itemIds[3]),protectedAfter=after.trip_items.find(p=>p.id===itemIds[3]);assert.equal(protectedAfter.day_id,null);assert.equal(protectedAfter.stage_id,null)
   for(const key of ['title','starts_on','ends_on','starts_at','ends_at','price_amount','price_currency','booking_status','booking_source','booking_confirmed_at'])assert.deepEqual(protectedAfter[key],protectedBefore[key]);await page.reload();await open();assert.equal(await page.getByLabel('Gesamtdauer in Tagen').inputValue(),'2')
  })
  await check('Later unrelated mutation invalidates replay even if single lastMutationId remains',async()=>{
   const before=await read();await db.from('trip_items').update({note:'Later unrelated edit'}).eq('id',itemIds[0]);const newer=await read();assert.equal(newer.revision,before.revision+1);await replay(ctx,applyRequest);assert.equal((await read()).revision,newer.revision)
  })
  await check('A09 v1.1 Account linked removal refuses before RPC and preserves complete graph, references and draft',async()=>{
   const inserted=await db.from('trip_readiness_items').insert({trip_id:tripId,client_ref:'synthetic-dependent-preparation',kind:'preparation',title:'Synthetische Vorbereitung',context_fingerprint:'synthetic-contract-probe',trip_item_id:itemIds[1]}).select('*').single();assert.ifError(inserted.error)
   const before=await read(),rpcBefore=traffic.rpc,refs=await db.from('trip_readiness_items').select('*').eq('trip_id',tripId);assert.ifError(refs.error)
   await page.reload();await open();await page.getByLabel('Reisetitel',{exact:true}).fill('Vorbereitung bleibt erhalten');await page.getByLabel('Gesamtdauer in Tagen').fill('1');await page.getByRole('button',{name:'Auswirkungen ansehen'}).click();await page.getByRole('alert').filter({hasText:/verknüpfte Vorbereitungen/}).waitFor();assert.equal(await page.getByRole('button',{name:'Änderung ausdrücklich übernehmen'}).count(),0)
   assert.equal(await page.getByLabel('Gesamtdauer in Tagen').inputValue(),'1');assert.equal(await page.getByLabel('Reisetitel',{exact:true}).inputValue(),'Vorbereitung bleibt erhalten');assert.deepEqual(await read(),before);assert.deepEqual((await db.from('trip_readiness_items').select('*').eq('trip_id',tripId)).data,refs.data);assert.equal(traffic.rpc,rpcBefore)
  })
  await check('A09 v1.1 Account unrelated edit remains available on a trip with Preparation references',async()=>{
   const before=await read(),refs=await db.from('trip_readiness_items').select('*').eq('trip_id',tripId);assert.ifError(refs.error)
   await page.getByLabel('Gesamtdauer in Tagen').fill('2');await preview();await save();await saved();const after=await read();assert.equal(after.title,'Vorbereitung bleibt erhalten');assert.equal(after.revision,before.revision+1);assert.deepEqual((await db.from('trip_readiness_items').select('*').eq('trip_id',tripId)).data,refs.data)
   const clean=rows=>rows.map(row=>{const copy={...row};delete copy.updated_at;return copy}).sort((a,b)=>a.id.localeCompare(b.id));assert.deepEqual(clean(after.trip_items),clean(before.trip_items));await page.reload();await open();assert.equal(await page.getByLabel('Reisetitel',{exact:true}).inputValue(),'Vorbereitung bleibt erhalten')
  })
  await check('Baseline unchanged SQL linked-deletion probe rejects with 23502 and full rollback; not a supported UI operation',async()=>{
   const before=await read(),graph=reiseAus(before,before.trip_stages,before.trip_days,before.trip_items),refs=await db.from('trip_readiness_items').select('*').eq('trip_id',tripId);assert.ifError(refs.error)
   const payload=aenderungAlsNutzlast({...graph,days:graph.days.map(d=>({...d,items:d.items.filter(p=>p.id!==itemIds[1])}))},'synthetic-linked-removal-probe',before.revision)
   const result=await db.rpc('reise_aendern',{_aenderung:payload});assert.equal(result.error?.code,'23502');assert.deepEqual(await read(),before);assert.deepEqual((await db.from('trip_readiness_items').select('*').eq('trip_id',tripId)).data,refs.data)
   contractProbes.push({name:'Existing composite Preparation FK baseline',status:'EXPECTED_REJECTION',sqlstate:result.error.code,rollback:'complete graph and Preparation rows equal',rawErrorPublished:false,clarification:'https://github.com/Jetnity/jetnity/pull/905#issuecomment-6044443343'})
  })
  assert.equal(traffic.catalog,0);assert.equal(traffic.quota,0);assert.deepEqual(outbound,[]);assert.deepEqual(errors,[]);await ctx.close();return {status:'PASS'}
 }catch(e){failure=`${step}: ${e.message}`;if(page)await page.screenshot({path:`${dir}/screens/account-diagnostic.png`,fullPage:true}).catch(()=>{});throw Error(failure)}
 finally{control({reads:false,afterWrite:false,loseAck:false});await browser.close();for(const c of clients)await c.auth.stopAutoRefresh();writeFileSync(`${dir}/account-browser.json`,JSON.stringify({status:failure?'FAIL':'PASS',executionStatus:failure?'FAIL':'PASS',environment:{browser:browser.version(),node:process.version},contractProbes,results,failure,traffic,errors,outbound,boundary:'Real GoTrue sessions, unchanged production server actions, authenticated PostgREST RLS and reise_aendern, child trigger; isolated loopback proxy fault injection only'},null,2)+'\n')}
}
