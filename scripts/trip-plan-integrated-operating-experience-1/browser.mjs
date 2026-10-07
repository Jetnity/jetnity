// Production route + production Guest component and persistence functions; synthetic input only.
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdirSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright'
const require=createRequire(import.meta.url),{build}=createRequire(require.resolve('tsx'))('esbuild')
const base=process.env.AUDIT_BASE||'http://127.0.0.1:3497'
assert(['127.0.0.1','localhost'].includes(new URL(base).hostname),'Loopback only')
const dir='docs/evidence/trip-plan-integrated-operating-experience-1'
mkdirSync(`${dir}/screens`,{recursive:true})
const bundle=await build({stdin:{contents:`
import {gastreiseAnlegen,gastreiseSpeichern,gastreiseLadenNach,gastPlanpunktAnlegen,gastMobilitaetAnlegen} from './lib/trips/gastspeicher';
import {gastReadinessSetzen} from './lib/readiness/gast';
import {itineraryAirportChange} from './lib/route/fixtures';
import {tripMovements} from './lib/trips/trip-plan-integrated/movements';
import React from 'react';import {createRoot} from 'react-dom/client';import TripIntegratedDay from './components/trips/TripIntegratedDay';
window.planAudit={create:(long=false)=>{
  localStorage.clear();
  let trip=gastreiseAnlegen({clientRef:'trip-'+crypto.randomUUID(),title:'Synthetische Reise',destination:'Florenz',destinationPlaceId:'geonames:3176959',origin:'Zürich',originPlaceId:'geonames:2657896',startDate:'2026-10-07',endDate:long?'2027-02-03':'2026-10-11',travellers:1,currency:'CHF',budgetAmount:null,pace:'balanced',interests:['culture'],travelWish:null});
  const add=(kind,title,extra={})=>{trip=gastPlanpunktAnlegen(trip,{dayId:trip.days[0].id,clientRef:crypto.randomUUID(),kind,title,note:null,startsAt:null,...extra})};
  add('activity','Museum', {startsOn:'2026-10-07',startsAt:'10:00',endsOn:'2026-10-07',endsAt:'11:00'});
  add('activity','Spaziergang ohne genaue Zeit');add('stay','Unterkunft für drei Nächte');add('flight','Manueller Flug');
  trip=gastreiseSpeichern({...trip,originPlaceId:'airport:ZRH',stages:trip.stages.map(s=>({...s,latitude:0,longitude:0,placeId:'airport:FLR',countryCode:null})),days:trip.days.map((d,i)=>({...d,items:d.items.map((p,j)=>i===0?{...p,...(j===0?{priceAmount:18,priceCurrency:'EUR'}:j===2?{priceAmount:300,priceCurrency:'CHF',startsOn:'2026-10-07',endsOn:'2026-10-10',bookingStatus:'booked',bookingSource:'user',bookingConfirmedAt:'2026-10-01T10:00:00.000Z'}:{})}:p)}))});
  trip=gastPlanpunktAnlegen(trip,{dayId:trip.days[2].id,clientRef:crypto.randomUUID(),kind:'note',title:'Flexibler Tag ohne Uhrzeit',note:null,startsAt:null});
  if(long) { const stages=Array.from({length:6},(_,i)=>({...trip.stages[0],id:'stage-long-'+i,position:i+1,name:'Etappe '+(i+1),arrivalDate:trip.days[i*20].dayDate,departureDate:trip.days[Math.min((i+1)*20-1,trip.days.length-1)].dayDate}));trip=gastreiseSpeichern({...trip,stages,days:trip.days.map((d,i)=>({...d,stageId:stages[Math.floor(i/20)].id,items:d.items.map(p=>({...p,stageId:stages[Math.floor(i/20)].id}))}))}) }
  trip=gastReadinessSetzen(trip,{kind:'preparation',userStatus:'open',tripItemId:trip.days[0].items[0].id,title:'Museum vorbereiten'});
  return trip;
}, mountSurface:id=>{const t=gastreiseLadenNach(id);const initial={...t,days:t.days.map(d=>({...d,items:d.items.map(p=>p.kind==='flight'?{...p,routeItinerary:itineraryAirportChange()}:p)}))};const root=document.createElement('section');root.dataset.qualifiedMovementFixture='';document.body.append(root);function Fixture(){const [graph,setGraph]=React.useState(initial);return <TripIntegratedDay reise={graph} dayId={graph.days[0].id} ordered={graph.days[0].items} onVerbindungAnlegen={async values=>{setGraph(gastMobilitaetAnlegen(graph,values));return null}}/>}createRoot(root).render(<Fixture/>);}, movements:id=>tripMovements(gastreiseLadenNach(id)), surface:id=>{const t=gastreiseLadenNach(id);return gastreiseSpeichern({...t,days:t.days.map(d=>({...d,items:d.items.map(p=>p.kind==='flight'?{...p,routeItinerary:itineraryAirportChange()}:p)}))})}, read:id=>gastreiseLadenNach(id), save:gastreiseSpeichern};`,resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,platform:'browser',define:{'process.env.NODE_ENV':'"production"'}})
const seed=bundle.outputFiles[0].text
const browser=await chromium.launch({headless:true,channel:'chrome'})
const results=[],errors=[],external=[]
let status='FAIL',failure
const context=async(width=390,height=844)=>{
  const ctx=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'})
  await ctx.route('**/*',route=>{
    if(new URL(route.request().url()).origin!==base){external.push(new URL(route.request().url()).origin);return route.abort()}
    return route.continue()
  })
  const page=await ctx.newPage();page.setDefaultTimeout(15000)
  page.on('pageerror',e=>errors.push(e.message))
  await page.goto(`${base}/reisen/trip-fixture`)
  await page.addScriptTag({content:seed})
  const trip=await page.evaluate(()=>window.planAudit.create())
  const url=`${base}/reisen/${trip.id}?ansicht=plan&tag=${trip.days[0].id}`
  await page.goto(url);await page.locator('[data-plan-hinzufuegen]').waitFor()
  return {ctx,page,trip,url}
}
const read=page=>page.evaluate(()=>JSON.parse(localStorage.getItem('jetnity:reise:v3')))
const add=async(page,title)=>{
  await page.locator('[data-plan-hinzufuegen]').click()
  const form=page.getByRole('form',{name:'Punkt hinzufügen',exact:true})
  await form.getByLabel('Ort oder Aktivität').fill(title)
  return form
}
const inspect=async(page,name)=>{
  const result=await page.locator('[data-plan-premium]').evaluate(el=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,font:getComputedStyle(document.documentElement).fontSize,
    controls:[...el.querySelectorAll('button,input,select,summary')].filter(e=>e.getClientRects().length).map(e=>{const r=e.getBoundingClientRect();return {tag:e.tagName,label:e.getAttribute('aria-label')||e.textContent.slice(0,80),width:r.width,height:r.height,left:r.left,right:r.right}})}))
  assert(result.scrollWidth<=result.width+1,`${name}: overflow ${result.scrollWidth}/${result.width}`)
  assert(result.controls.every(x=>x.height>=43&&x.width>=43),`${name}: undersized target ${JSON.stringify(result.controls.filter(x=>x.height<43||x.width<43))}`)
  results.push({name,status:'PASS',...result})
}
try {
  for(const width of [360,390,768,1440]){
    const {ctx,page}=await context(width,width===768?1024:900)
    for(const zoom of [1,2]){
      await page.evaluate(z=>document.documentElement.style.fontSize=`${16*z}px`,zoom)
      await inspect(page,`production-plan-${width}-text-${zoom*100}`)
      const layoutForm=await add(page,'Layoutprüfung')
      await inspect(page,`production-form-${width}-text-${zoom*100}`)
      assert.equal(await layoutForm.evaluate(f=>f.scrollWidth<=f.clientWidth+1),true,'Form children must fit the form, not merely a clipping ancestor')
      if(width===360&&zoom===2)await layoutForm.screenshot({path:`${dir}/screens/form-360-text-200.png`})
      await page.keyboard.press('Escape');await layoutForm.waitFor({state:'detached'})
      if((width===390&&zoom===1)||(width===360&&zoom===2)||(width===1440&&zoom===1))await page.screenshot({path:`${dir}/screens/plan-${width}-text-${zoom*100}.png`,fullPage:true})
    }
    await ctx.close()
  }
  const {ctx,page,trip,url}=await context()
  let form=await add(page,'Expliziter Termin')
  await form.getByLabel('Anfangsdatum, optional').fill('2026-10-07');await form.getByLabel('Anfangszeit, optional').fill('14:00')
  await form.getByLabel('Enddatum, optional').fill('2026-10-07');await form.getByLabel('Endzeit, optional').fill('15:30')
  await form.getByRole('button',{name:'Speichern',exact:true}).click();await form.waitFor({state:'detached'})
  assert.match(await page.locator('[role=status]').allTextContents().then(a=>a.join(' ')),/Planpunkt gespeichert/)
  const stored=await read(page),created=stored.days[0].items.find(p=>p.title==='Expliziter Termin')
  assert(created);assert.equal(created.startsAt,'14:00');assert.equal(created.endsAt,'15:30')
  await page.reload();assert.deepEqual((await read(page)).days[0].items.find(p=>p.id===created.id),created)
  await page.getByRole('button',{name:'Expliziter Termin bearbeiten',exact:true}).click()
  form=page.getByRole('form',{name:'Punkt bearbeiten: Expliziter Termin',exact:true})
  await form.getByLabel('Anfangszeit, optional').fill('14:30');await form.getByLabel('Endzeit, optional').fill('16:00')
  await form.getByRole('button',{name:'Speichern',exact:true}).click();await form.waitFor({state:'detached'})
  assert.equal((await read(page)).days[0].items.find(p=>p.id===created.id).startsAt,'14:30')
  await page.reload();assert.equal((await read(page)).days[0].items.find(p=>p.id===created.id).endsAt,'16:00')
  results.push({name:'Real Guest create trip -> create item -> edit -> confirmed storage -> reload exact identity and dates',status:'PASS'})
  await page.getByRole('button',{name:'Spaziergang ohne genaue Zeit bearbeiten',exact:true}).click()
  form=page.getByRole('form',{name:'Punkt bearbeiten: Spaziergang ohne genaue Zeit',exact:true})
  assert.equal(await form.getByLabel('Anfangsdatum, optional').inputValue(),'');assert.equal(await form.getByLabel('Enddatum, optional').inputValue(),'')
  await form.getByLabel('Ort oder Aktivität').fill('Flexibler Spaziergang');await form.getByRole('button',{name:'Speichern',exact:true}).click();await form.waitFor({state:'detached'})
  const flexible=(await read(page)).days[0].items.find(p=>p.title==='Flexibler Spaziergang');assert.equal(flexible.startsOn,null);assert.equal(flexible.endsAt,null)
  form=await add(page,'Speicherfehler Entwurf')
  await page.evaluate(()=>{window.restoreSetItem=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw new DOMException('Synthetic quota','QuotaExceededError')}})
  await form.getByRole('button',{name:'Speichern',exact:true}).click()
  await form.getByRole('alert').waitFor();assert.equal(await form.getByLabel('Ort oder Aktivität').inputValue(),'Speicherfehler Entwurf')
  assert(!(await read(page)).days.flatMap(d=>d.items).some(p=>p.title==='Speicherfehler Entwurf'))
  await page.evaluate(()=>Storage.prototype.setItem=window.restoreSetItem)
  await page.keyboard.press('Escape');await form.waitFor({state:'detached'})
  await page.waitForFunction(()=>document.querySelector('[data-plan-hinzufuegen]')===document.activeElement)
  assert.equal(await page.locator('[data-plan-hinzufuegen]').evaluate(el=>el===document.activeElement),true)
  results.push({name:'Unknown stays unknown; quota failure retains draft without success; Escape restores trigger',status:'PASS'})
  await page.getByRole('button',{name:'Museum bearbeiten',exact:true}).click();form=page.getByRole('form',{name:'Punkt bearbeiten: Museum',exact:true})
  await form.getByLabel('Anfangszeit, optional').fill('10:15')
  assert.match(await form.locator('[data-plan-preview]').innerText(),/1 nachweislich/)
  await form.getByRole('button',{name:'Speichern',exact:true}).click();await form.waitFor({state:'detached'})
  assert.match(await page.locator('[data-plan-impact]').innerText(),/1 nachgewiesene/)
  assert.match(await page.locator('[data-day-costs]').innerText(),/300/);assert.match(await page.locator('[data-day-costs]').innerText(),/18/)
  await page.getByText('Orte ansehen',{exact:true}).click();assert.match(await page.locator('[data-day-places]').innerText(),/Etappenort/)
  assert.match(await page.locator('[data-day-places]').innerText(),/Genauer Ort nicht hinterlegt/)
  await page.getByRole('button',{name:'Museum vorbereiten',exact:true}).first().click()
  await page.locator('[data-workspace-modus="vorbereitung"]').waitFor()
  assert(new URL(page.url()).searchParams.get('ansicht')==='vorbereitung')
  await page.goBack();await page.locator('[data-plan-hinzufuegen]').waitFor()
  assert.equal(new URL(page.url()).searchParams.get('tag'),trip.days[0].id)
  await page.goForward();await page.locator('[data-workspace-modus="vorbereitung"]').waitFor()
  await page.keyboard.press('Escape');await page.locator('[data-plan-hinzufuegen]').waitFor()
  results.push({name:'Pure impact preview, saved impact, currencies, unknown venue; exact Preparation -> back/forward/Escape origin',status:'PASS'})
  await page.locator('[data-plan-tag-naechster]').click();await page.locator('[data-plan-leer]').waitFor()
  assert.equal(new URL(page.url()).searchParams.get('tag'),trip.days[1].id)
  await page.locator('[data-plan-tag-naechster]').click();await page.locator('[data-plan-tages-timeline]').getByText('Flexibler Tag ohne Uhrzeit',{exact:true}).waitFor()
  assert.equal(await page.locator('[data-plan-flexibel]').count(),1)
  await page.goto(url);await page.getByRole('button',{name:'Museum bearbeiten',exact:true}).click()
  form=page.getByRole('form',{name:'Punkt bearbeiten: Museum',exact:true});await form.getByLabel('Zuordnung im Tagesplan').selectOption('')
  await form.getByRole('button',{name:'Speichern',exact:true}).click();await form.waitFor({state:'detached'})
  const moved=(await read(page)).ohneTag.find(p=>p.title==='Museum');assert(moved);assert.equal(moved.priceAmount,18)
  await page.reload();assert.equal((await read(page)).ohneTag.find(p=>p.id===moved.id).startsAt,'10:15')
  results.push({name:'Empty day navigation; exact item move to unassigned retains time and commercial amount across reload',status:'PASS'})
  await page.goto(url)
  const flight=(await read(page)).days[0].items.find(p=>p.kind==='flight')
  await page.locator(`[data-plan-punkt="${flight.id}"]`).getByRole('button').first().click()
  const flights=page.getByRole('region',{name:'Deine Flüge'})
  await flights.getByRole('button',{name:'Flugroute ergänzen',exact:true}).click()
  let flightForm=page.getByRole('form',{name:'Flugroute für Manueller Flug'})
  for(const [label,value] of [['Abflugflughafen (IATA)','ZRH'],['Ankunftsflughafen (IATA)','FLR'],['Abflugdatum','2026-10-07'],['Abflugzeit (optional)','09:00'],['Ankunftsdatum','2026-10-07'],['Ankunftszeit (optional)','10:00']])await flightForm.getByLabel(label,{exact:true}).fill(value)
  assert.match(await flights.locator(`[data-flug-punkt="${flight.id}"]`).innerText(),/Noch keinem Reiseabschnitt/)
  await flightForm.getByRole('button',{name:'Speichern',exact:true}).click();await flightForm.waitFor({state:'detached'})
  await page.waitForFunction(id=>document.activeElement?.closest('[data-flug-punkt]')?.getAttribute('data-flug-punkt')===id,flight.id)
  const row=flights.locator(`[data-flug-punkt="${flight.id}"]`)
  assert.doesNotMatch(await row.innerText(),/Noch keinem Reiseabschnitt/)
  const focus=await page.evaluate(()=>{const r=document.activeElement.getBoundingClientRect();return {tag:document.activeElement.tagName,top:r.top,bottom:r.bottom,height:innerHeight}})
  assert(focus.top>=60&&focus.bottom<focus.height,'F02 saved flight focus stays visible above footer')
  assert.match(await flights.innerText(),/Flugroute gespeichert/)
  await page.screenshot({path:`${dir}/screens/flight-reclassified-focus.png`})
  await row.getByRole('button',{name:'Flugroute ändern',exact:true}).click();flightForm=page.getByRole('form',{name:'Flugroute für Manueller Flug'})
  for(const [label,value] of [['Abflugflughafen (IATA)','NRT'],['Ankunftsflughafen (IATA)','LAX'],['Abflugdatum','2026-10-08'],['Abflugzeit (optional)','23:30'],['Ankunftsdatum','2026-10-07'],['Ankunftszeit (optional)','12:00']])await flightForm.getByLabel(label,{exact:true}).fill(value)
  await flightForm.getByRole('button',{name:'Speichern',exact:true}).click();await flightForm.waitFor({state:'detached'})
  const dated=(await read(page)).days[0].items.find(p=>p.id===flight.id)
  assert.equal(dated.endsOn,null);assert.equal(dated.routeItinerary.legs[0].segments[0].arrivalDate,'2026-10-07')
  await page.reload();await flights.getByRole('button',{name:'Flugroute ändern',exact:true}).click()
  flightForm=page.getByRole('form',{name:'Flugroute für Manueller Flug'});assert.equal(await flightForm.getByLabel('Ankunftsdatum',{exact:true}).inputValue(),'2026-10-07')
  await page.keyboard.press('Escape');await flightForm.waitFor({state:'detached'})
  assert.equal(await flights.getByRole('button',{name:'Flugroute ändern',exact:true}).evaluate(e=>e===document.activeElement),true)
  await page.goto(`${base}/reisen/${trip.id}`)
  const accessible=await page.locator('[aria-label="Jetzt wichtig"]').ariaSnapshot()
  assert.doesNotMatch(accessible,/known_gap|not_evaluable|insufficient_context|ungeprueft/)
  results.push({name:'F02 reproduced direction bucket change -> saved result/status/focus visible; Date Line exact fields survive reload and Escape',status:'PASS',focus})
  await page.goto(`${base}/reisen/trip-fixture`);await page.addScriptTag({content:seed})
  await page.evaluate(id=>window.planAudit.surface(id),trip.id)
  await page.goto(url);await page.addScriptTag({content:seed})
  assert.equal((await page.evaluate(id=>window.planAudit.movements(id),trip.id)).needs.length,0,'Browser/local-storage surface authority is stripped by the unchanged canonical intake')
  // The trusted-input edge cannot be minted by Guest storage. Exercise the production panel
  // with an explicitly synthetic typed fixture and the ACTUAL Guest persistence callback.
  await page.evaluate(id=>window.planAudit.mountSurface(id),trip.id)
  const qualified=page.locator('[data-qualified-movement-fixture]')
  await qualified.getByText('Verbindungen und Zeitgrundlage',{exact:true}).click()
  await qualified.getByText('Transfer fehlt im Plan',{exact:true}).waitFor()
  const beforeMovement=JSON.stringify(await read(page))
  await qualified.getByRole('button',{name:'Verbindung ergänzen',exact:true}).click()
  const movement=qualified.getByRole('region',{name:'Manuelle Verbindung',exact:true})
  assert.equal(await movement.getByLabel('Von',{exact:true}).inputValue(),'CDG')
  assert.equal(await movement.getByLabel('Nach',{exact:true}).inputValue(),'ORY')
  assert.equal(await movement.getByLabel('Abfahrt',{exact:true}).inputValue(),'')
  assert.equal(JSON.stringify(await read(page)),beforeMovement,'Prefill is not a write')
  await movement.getByRole('button',{name:'Verbindung speichern',exact:true}).click()
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('jetnity:reise:v3')).days[0].items.some(p=>p.kind==='transfer'))
  const transfer=(await read(page)).days[0].items.find(p=>p.kind==='transfer')
  assert(transfer);assert.equal(transfer.originPlaceId,'airport:CDG');assert.equal(transfer.destinationPlaceId,'airport:ORY')
  assert.equal(transfer.startsOn,null)
  assert.equal((await page.evaluate(id=>window.planAudit.movements(id),trip.id)).needs.length,0)
  await page.reload();assert.deepEqual((await read(page)).days[0].items.find(p=>p.id===transfer.id),transfer)
  results.push({name:'Explicit synthetic trusted surface fixture -> production panel editable prefill -> real Guest movement persistence; browser authority remains stripped',status:'PASS'})
  await page.goto(`${base}/reisen/trip-fixture`);await page.addScriptTag({content:seed})
  const long=await page.evaluate(()=>window.planAudit.create(true))
  await page.goto(`${base}/reisen/${long.id}?ansicht=plan&tag=${long.days.at(-1).id}`)
  await page.locator('[data-plan-leer]').waitFor();await inspect(page,'120-day-trip-last-day')
  await page.setViewportSize({width:844,height:390});await inspect(page,'landscape-844x390')
  await ctx.close()
  assert.deepEqual(errors,[],'Browser runtime errors');assert.deepEqual(external,[],'No external requests during real Plan flow')
  status='PASS'
} catch(error){failure=error.stack;console.error(failure);process.exitCode=1}
finally {await browser.close();writeFileSync(`${dir}/browser.json`,JSON.stringify({status,base,browser:browser.version(),results,errors,external,failure,realDevices:'NOT_RUN',webkit:'NOT_RUN',screenReader:'NOT_RUN'},null,2)+'\n');console.log(`${status}: ${results.length} browser cases`)}
