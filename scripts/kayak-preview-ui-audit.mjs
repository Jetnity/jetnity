import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
const out = process.env.KAYAK_UI_OUTPUT ?? '/tmp/jetnity-kayak-preview-audit';
const base = process.env.KAYAK_UI_BASE_URL ?? 'http://127.0.0.1:3460';
mkdirSync(out, { recursive: true });
const reise = { id:'trip-audit-workspace',clientRef:'trip-audit-workspace',title:'Bangkok',origin:'Zürich',originPlaceId:'airport:ZRH',startDate:'2026-12-10',endDate:'2026-12-20',travellers:2,currency:'CHF',budgetAmount:3500,status:'draft',pace:'calm',interests:['beach'],travelWish:null,revision:1,lastMutationId:null,stages:[{id:'stage-1',position:1,name:'Bangkok',countryCode:'TH',arrivalDate:'2026-12-10',departureDate:'2026-12-20',latitude:13.7563,longitude:100.5018,placeId:'airport:BKK'}],days:[{id:'day-1',stageId:'stage-1',dayIndex:1,dayDate:'2026-12-10',title:null,items:[]}],ohneTag:[],createdAt:'2026-11-04T10:00:00.000Z',updatedAt:'2026-11-04T10:00:00.000Z',party:[] };
const hotels = Array.from({length:5},(_,i)=>({id:String(i),name:['Riverside Bangkok','Garden Hotel','City Residence','Grand Bangkok','Old Town Hotel'][i],address:'Bangkok, Thailand',image:null,stars:4,rating:[9.1,8.5,7.2,8.9,7.8][i],reviews:80,price:100+i*50,currency:'USD',room:'Doppelzimmer',freeCancellation:i%2===0,provider:'KAYAK'}));
const flights = Array.from({length:3},(_,i)=>({id:String(i),legs:[{origin:'ZRH',destination:'BKK',departure:'2026-12-10T13:00:00',arrival:'2026-12-11T05:40:00',duration:640,stops:i===1?1:0,airlines:['Swiss']},{origin:'BKK',destination:'ZRH',departure:'2026-12-20T10:00:00',arrival:'2026-12-20T17:00:00',duration:780,stops:i===1?1:0,airlines:['Swiss']}],price:650+i*100,currency:'USD',priceMode:'perPerson'}));
const browser = await chromium.launch({headless:true});
try {
 for (const width of [1440,1024,640,390,320]) {
  const context=await browser.newContext({viewport:{width,height:width===390?844:1000}});
  await context.addInitScript(p=>sessionStorage.setItem('jetnity:ui-audit:workspace',JSON.stringify(p)),{reise,quelle:'guest',mitSuche:true});
  const page=await context.newPage(); let count=0; let mode='success'; let lastInput;
  await page.clock.setFixedTime(new Date('2026-11-09T12:00:00Z'));
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/api/kayak/preview',async route=>{count++;lastInput=route.request().postDataJSON();const kind=lastInput.kind;if(mode==='error')return route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({message:'Die Testsuche ist vorübergehend nicht verfügbar.'})});await route.fulfill({contentType:'application/json',body:JSON.stringify({mode:'sandbox',kind,complete:true,checkedAt:new Date().toISOString(),hotels:kind==='hotels'&&mode!=='empty'?hotels:[],flights:kind==='flights'&&mode!=='empty'?flights:[]})});});
  for(const kind of ['hotels','flights']){
   mode='success';const before=count;
   await page.goto(base+'/ui-audit/trip-workspace?ansicht=organisieren&bereich='+(kind==='hotels'?'unterkunft':'fluege'));
   await page.getByRole('button',{name:kind==='hotels'?'Unterkunft suchen':'Flug suchen',exact:true}).click();
   const section=page.getByRole('region',{name:kind==='hotels'?'Unterkunftssuche':'Flugsuche für deine Reise',exact:true});await section.waitFor();
   assert.equal(count,before,'No automatic search');
   const placement = kind === 'hotels' ? 'jetnity-hotel' : 'jetnity-flug';
   const clickRoute = '**/click-101919996-14082404*';
   await context.route(clickRoute, route => route.fulfill({contentType:'text/plain',body:'CJ handoff captured locally'}));
   const beforeHandoff = page.url();
   const [outbound] = await Promise.all([
     context.waitForEvent('page'),
     section.getByRole('button',{name:kind==='hotels'?'Unterkünfte bei Booking.com suchen':'Flüge bei Booking.com suchen'}).click(),
   ]);
   await outbound.waitForURL(clickRoute);
   const click = new URL(outbound.url());
   assert.deepEqual([...click.searchParams.keys()].sort(), ['sid','url']);
   assert.equal(click.searchParams.get('sid'), placement);
   const destination = new URL(click.searchParams.get('url'));
   if (kind==='hotels') {
     assert.equal(destination.searchParams.get('ss'), 'Bangkok, Thailand');
     assert.equal(destination.searchParams.get('group_adults'), '2');
     assert.equal(destination.searchParams.get('checkin'), reise.startDate);
   } else {
     assert.equal(destination.pathname, '/flights/ZRH.AIRPORT-BKK.AIRPORT/');
     assert.equal(destination.searchParams.get('return'), reise.endDate);
   }
   assert.equal(page.url(), beforeHandoff);
   assert.equal(count, before, 'Booking.com submit does not load KAYAK');
   await outbound.close();
   await context.unroute(clickRoute);
   await section.getByText('KAYAK-Testvorschau',{exact:true}).click();
   await section.getByRole('button',{name:'Testangebote ansehen',exact:true}).click();
   await section.getByRole('heading',{name:kind==='hotels'?'5 Unterkünfte zum Entdecken':'3 Flugverbindungen im Vergleich',exact:true}).waitFor();
   assert.equal(lastInput.kind,kind);if(kind==='flights'){assert.equal(lastInput.origin,'ZRH');assert.equal(lastInput.destination,'BKK');}
   assert.ok(await section.getByText(/Nicht buchbar/).count()>0);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No horizontal overflow');
   if(kind==='flights'){for(const clock of await section.getByText(/^\d{2}:\d{2}$/).all()){assert.ok((await clock.boundingBox()).height<=32,'Flight times stay on one line');}}
   await section.screenshot({path:`${out}/${kind}-${width}.png`});
   if(kind==='flights'){await section.getByLabel('Nur Direktflüge').check();assert.equal(await section.getByText(/Nicht buchbar/).count(),2);}
   await section.getByLabel('Erwachsene',{exact:true}).fill('3');
   assert.equal(await section.getByText(/Nicht buchbar/).count(),0,'Inputs invalidate stale results');
   mode='error';await section.getByRole('button',{name:'Testangebote ansehen',exact:true}).click();await section.getByRole('alert').waitFor();
   mode='empty';await section.getByRole('button',{name:'Testangebote ansehen',exact:true}).click();
   await page.waitForTimeout(150);assert.equal(await section.getByText(/Nicht buchbar/).count(),0);
   console.log(JSON.stringify({width,kind,requests:count-before,status:'PASS'}));
  }
  assert.deepEqual(errors,[]);await context.close();
 }
} finally {await browser.close();}
