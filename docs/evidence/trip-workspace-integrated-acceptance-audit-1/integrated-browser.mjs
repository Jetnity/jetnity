// Read-only product audit harness. Only local browser fixture writes; no app source edits.
import assert from 'node:assert/strict'
import { writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { fixture } from './fixtures.mjs'
const out=dirname(fileURLToPath(import.meta.url))
const base='http://127.0.0.1:3487'
const browser=await chromium.launch({headless:true,channel:'chrome'})
const results={checkedAt:new Date().toISOString(),server:'Next development, loopback only, no real auth/DB credentials',browser:browser.version(),runs:[]}
const viewports=[{width:360,height:800},{width:390,height:844},{width:768,height:1024},{width:1440,height:900}]
const persist=()=>writeFileSync(join(out,'integrated-browser.json'),JSON.stringify(results,null,2)+'\n')
mkdirSync(join(out,'integrated'),{recursive:true})
async function measure(page,name,run,screen=true){
 const m=await page.evaluate(()=>{
  const rect=el=>{if(!el)return null;const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}}
  const visible=el=>el.getClientRects().length&&!el.closest('[hidden],[inert]')
  const controls=[...document.querySelectorAll('main button,main input,main summary,main a')].filter(visible)
  return {width:innerWidth,scrollWidth:document.documentElement.scrollWidth,overflow:Math.max(0,document.documentElement.scrollWidth-innerWidth),
   scrollY,fontSize:getComputedStyle(document.documentElement).fontSize,focus:document.activeElement?.getAttribute('aria-label')||document.activeElement?.textContent?.trim().slice(0,130)||document.activeElement?.tagName,
   hiddenFocus:!!document.activeElement?.closest('[hidden],[inert]'),
   nav:[...document.querySelectorAll('[data-workspace-mode-nav] button')].map(el=>({text:el.textContent,...rect(el)})),
   detail:rect(document.querySelector('[data-workspace-detail]')),work:rect(document.querySelector('[data-workspace-arbeit="ein"]')),
   smallControls:controls.filter(el=>el.getBoundingClientRect().height<43||el.getBoundingClientRect().width<24).map(el=>({text:el.textContent?.trim().slice(0,100),tag:el.tagName,...rect(el)})),
   undersizedInputs:controls.filter(el=>el.tagName==='INPUT'&&parseFloat(getComputedStyle(el).fontSize)<16).length}
 })
 run.measurements.push({name,url:page.url(),...m})
 if(screen) await page.screenshot({path:join(out,'integrated',run.name+'-'+name+'.png')})
 if(m.overflow>1)run.findings.push({name,kind:'page-horizontal-overflow',pixels:m.overflow})
 if(m.hiddenFocus)run.findings.push({name,kind:'hidden-focus'})
 persist()
}
for(const viewport of viewports){
 const run={name:String(viewport.width),viewport,cases:[],measurements:[],findings:[],pageErrors:[],blockedRequests:[]};results.runs.push(run)
 const context=await browser.newContext({viewport,hasTouch:viewport.width<1000,reducedMotion:'reduce'})
 await context.route('**/*',route=>{
  const r=route.request(),u=new URL(r.url())
  if(u.origin!==base||u.pathname.startsWith('/api/')||r.method()!=='GET'){run.blockedRequests.push(r.method()+' '+u.origin+u.pathname);return route.abort()}
  return route.continue()
 })
 await context.addInitScript(trip=>{if(!localStorage.getItem('jetnity:reise:v3'))localStorage.setItem('jetnity:reise:v3',JSON.stringify(trip))},fixture())
 const page=await context.newPage();page.setDefaultTimeout(8000)
 page.on('pageerror',e=>run.pageErrors.push(e.message))
 const modes=page.locator('[data-workspace-mode-nav]')
 const stored=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('jetnity:reise:v3')))
 const getItem=async id=>(await stored()).days.flatMap(d=>d.items).find(i=>i.id===id)
 const go=async(q='')=>{await page.goto(base+'/reisen/'+fixture().id+q,{waitUntil:'networkidle'});await modes.waitFor()}
 const mode=async name=>{await modes.getByRole('button',{name,exact:true}).click()}
 const back=()=>page.getByRole('button',{name:/^(Zur Übersicht|Zum Tagesplan|Zur Organisation)$/,exact:true}).filter({visible:true}).first()
 const flightEditor=()=>page.getByRole('form',{name:'Flugroute für Manueller Flug'})
 const editFlight=async()=>{await page.getByRole('button',{name:/Flugroute (ergänzen|ändern)/}).click();await flightEditor().waitFor()}
 const segments=[
  {origin:'ZRH',destination:'DOH',departureDate:'2026-11-01',departureTime:'10:00',arrivalDate:'2026-11-01',arrivalTime:'18:00'},
  {origin:'DOH',destination:'BKK',departureDate:'2026-11-01',departureTime:'19:00',arrivalDate:'2026-11-02',arrivalTime:'05:00'},
  {origin:'BKK',destination:'HND',departureDate:'2026-11-02',departureTime:'08:00',arrivalDate:'2026-11-02',arrivalTime:'16:00'},
  {origin:'HND',destination:'LAX',departureDate:'2026-11-02',departureTime:'23:30',arrivalDate:'2026-11-02',arrivalTime:'12:00'}]
 const labels={origin:'Abflugflughafen (IATA)',destination:'Ankunftsflughafen (IATA)',departureDate:'Abflugdatum',departureTime:'Abflugzeit (optional)',arrivalDate:'Ankunftsdatum',arrivalTime:'Ankunftszeit (optional)'}
 const fill=async values=>{for(let i=0;i<values.length;i++){const fieldset=flightEditor().locator('fieldset').nth(i);for(const [k,v] of Object.entries(values[i]))await fieldset.getByLabel(labels[k],{exact:true}).fill(v??'')}}
 try{
  await go();await measure(page,'overview',run)
  run.accessibilitySnapshot=await page.locator('[aria-label="Jetzt wichtig"]').ariaSnapshot()
  run.cases.push('real Guest route opens with local fixture')
  await page.getByRole('button',{name:'Unterkunft',exact:true}).click()
  await page.getByRole('button',{name:'Zeitraum ergänzen',exact:true}).click()
  await measure(page,'stay-editor',run)
  const stayForm=page.getByRole('form',{name:'Zeitraum für Manuelle Unterkunft'})
  await stayForm.getByLabel('Check-in',{exact:true}).fill('2026-11-01')
  await stayForm.getByLabel('Check-out',{exact:true}).fill('2026-11-01')
  const original=await stored()
  await stayForm.getByRole('button',{name:'Zeitraum speichern'}).click();await stayForm.getByRole('alert').waitFor()
  assert.deepEqual(await stored(),original)
  run.cases.push('invalid equal stay dates rejected without persistence')
  await stayForm.getByLabel('Check-out',{exact:true}).fill('2026-11-05')
  await stayForm.getByRole('button',{name:'Zeitraum speichern'}).click();await stayForm.waitFor({state:'hidden'})
  assert.equal((await getItem('manual-stay')).endsOn,'2026-11-05')
  assert.match(await page.getByRole('region',{name:'Deine Unterkunft'}).innerText(),/4 von 4 Nächten abgedeckt/)
  run.cases.push('stay save recomputes 4/4 nights in real Guest graph')
  await measure(page,'stay-saved',run)
  await page.reload({waitUntil:'networkidle'})
  await page.getByRole('button',{name:'Zeitraum ändern',exact:true}).click()
  assert.equal(await stayForm.getByLabel('Check-out',{exact:true}).inputValue(),'2026-11-05')
  await stayForm.getByLabel('Check-out',{exact:true}).fill('2026-11-03')
  await stayForm.getByRole('button',{name:'Zeitraum speichern'}).click();await stayForm.waitFor({state:'hidden'})
  assert.match(await page.getByRole('region',{name:'Deine Unterkunft'}).innerText(),/2 von 4 Nächten abgedeckt/)
  run.cases.push('stay reload/reopen/edit recomputes 2/4 nights')
  await back().click();await mode('Vorbereitung');await measure(page,'preparation',run)
  await mode('Übersicht');run.afterStayOverview=await page.locator('[data-workspace-trip-parts]').innerText()
  await page.getByRole('button',{name:'Flüge',exact:true}).click()
  for(let n=1;n<=4;n++){
   await editFlight();if(n>1)await flightEditor().getByRole('button',{name:'Segment hinzufügen',exact:true}).click()
   await fill(segments.slice(0,n))
   if(n===4){assert.equal(await flightEditor().getByRole('button',{name:'Segment hinzufügen',exact:true}).isDisabled(),true);await measure(page,'flight-four-editor',run)}
   await flightEditor().getByRole('button',{name:'Speichern',exact:true}).click()
   await flightEditor().waitFor({state:'hidden'})
   const f=await getItem('manual-flight');const actual=f.routeItinerary.legs[0].segments
   assert.equal(actual.length,n)
   for(let i=0;i<n;i++){for(const key of ['departureDate','departureTime','arrivalDate','arrivalTime'])assert.equal(actual[i][key],segments[i][key]);for(const p of [actual[i].origin,actual[i].destination]){assert.equal(p.countryCode,null);assert.equal(p.city,null)}}
   run.cases.push(n+' segments saved with exact local values and null countries/cities')
   await page.reload({waitUntil:'networkidle'})
  }
  await editFlight()
  await fill([segments[0],{...segments[1],departureTime:'17:00'},segments[2],segments[3]])
  const beforeInvalid=await stored()
  await flightEditor().getByRole('button',{name:'Speichern',exact:true}).click();await flightEditor().getByRole('alert').waitFor()
  assert.deepEqual(await stored(),beforeInvalid);run.cases.push('same-airport reverse connection rejected without persistence')
  await page.keyboard.press('Escape')
  assert.equal(await flightEditor().count(),0)
  assert.equal(await page.getByRole('button',{name:'Flugroute ändern',exact:true}).evaluate(el=>el===document.activeElement),true)
  assert.equal(await page.locator('[data-workspace-detail]').count(),1)
  run.cases.push('flight editor Escape keeps outer detail and restores trigger focus')
  await editFlight()
  for(let n=4;n>1;n--)await flightEditor().getByRole('button',{name:'Segment '+n+' entfernen',exact:true}).click()
  const dateline={origin:'NRT',destination:'LAX',departureDate:'2026-11-02',departureTime:'23:30',arrivalDate:'2026-11-01',arrivalTime:'12:00'}
  await fill([dateline]);await flightEditor().getByRole('button',{name:'Speichern',exact:true}).click();await flightEditor().waitFor({state:'hidden'})
  const d=await getItem('manual-flight');assert.equal(d.endsOn,null);assert.equal(d.endsAt,null)
  assert.equal(d.routeItinerary.legs[0].segments[0].arrivalDate,'2026-11-01')
  run.cases.push('date-line single segment preserves itinerary and nulls misleading legacy end')
  run.directFlightText=await page.getByRole('region',{name:'Deine Flüge'}).innerText()
  await measure(page,'dateline-saved',run)
  await page.reload({waitUntil:'networkidle'});await editFlight()
  assert.equal(await flightEditor().getByLabel('Ankunftsdatum',{exact:true}).inputValue(),'2026-11-01')
  assert.equal(await flightEditor().getByLabel('Abflugzeit (optional)',{exact:true}).inputValue(),'23:30')
  await flightEditor().getByRole('button',{name:'Abbrechen',exact:true}).click()
  await back().click();await mode('Reiseplan')
  await measure(page,'plan',run)
  await mode('Vorbereitung')
  const prep=page.getByRole('navigation',{name:'Bereiche der Vorbereitung'})
  await prep.locator('a[href="#preparation-offizielle-anforderungen"]').click()
  await page.reload({waitUntil:'networkidle'})
  run.cases.push('Guest preparation direct target survives reload')
  await measure(page,'preparation-target',run)
  await page.evaluate(()=>{document.documentElement.style.fontSize='200%'})
  await measure(page,'preparation-text200',run)
  await mode('Organisieren');await page.getByRole('button',{name:'Flüge',exact:true}).click();await editFlight()
  await measure(page,'flight-text200',run)
  await page.evaluate(()=>{document.documentElement.style.fontSize=''})
  assert.equal(/officialEvaluations|contextFingerprint|credentialOptionRef/.test(JSON.stringify(await stored())),false)
  run.storageKeys=await page.evaluate(()=>Object.keys(localStorage))
  run.cases.push('Guest localStorage has no evaluation payload')
  await page.evaluate(trip=>localStorage.setItem('jetnity:reise:v3',JSON.stringify(trip)),fixture(true))
  await go('?ansicht=plan&tag=day-30')
  await measure(page,'long-trip-day30',run)
  run.longTripText=await page.locator('[data-tagesplan-modul]').innerText()
  run.cases.push('30-day six-stage trip opens day 30 via URL')
  run.status=run.findings.length?'PARTIAL':'PASS'
 }catch(e){run.status='ERROR';run.error=e.stack;await measure(page,'error',run).catch(()=>{})}
 await context.close();persist()
}
await browser.close();persist()
console.log(JSON.stringify(results.runs.map(r=>({name:r.name,status:r.status,cases:r.cases.length,findings:r.findings,error:r.error?.split('\n')[0],pageErrors:r.pageErrors,blocked:r.blockedRequests})),null,2))
