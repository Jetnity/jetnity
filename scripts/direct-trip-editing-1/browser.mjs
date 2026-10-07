// Real production Guest route. Injection only seeds/observes synthetic localStorage.
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdirSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright'
const require=createRequire(import.meta.url),{build}=createRequire(require.resolve('tsx'))('esbuild')
const base=process.env.AUDIT_BASE||'http://127.0.0.1:3517',dir='docs/evidence/direct-trip-editing-1'
assert(['127.0.0.1','localhost'].includes(new URL(base).hostname));mkdirSync(`${dir}/screens`,{recursive:true})
const bundled=await build({stdin:{contents:`import {fixture,conflictFixture} from './scripts/direct-trip-editing-1/fixture';import {readinessItemLesen} from './lib/readiness/schema';import {gastreiseSpeichern,gastspeicherLaden} from './lib/trips/gastspeicher';window.directAudit={seed:(large=false,flexible=false,linked=false)=>{let t=fixture();if(linked)t={...t,readinessItems:[readinessItemLesen({id:"synthetic-linked",clientRef:"synthetic-linked",tripItemId:"item-3",kind:"preparation",title:"Synthetische Vorbereitung",userStatus:"open",contextFingerprint:"synthetic",createdAt:t.createdAt,updatedAt:t.updatedAt})]};if(flexible)t={...t,startDate:null,endDate:null,stages:t.stages.map(s=>({...s,arrivalDate:null,departureDate:null})),days:t.days.map(d=>({...d,dayDate:null}))};if(large){t={...t,title:'Lange synthetische Reise '.repeat(4),days:t.days.map((d,i)=>({...d,items:Array.from({length:250},(_,j)=>({...d.items[0],id:'large-'+i+'-'+j,position:j+1,title:'Langer synthetischer Planpunkt '+i+' '+j}))}))}}return gastreiseSpeichern(t)},seedConflict:()=>gastreiseSpeichern(conflictFixture()),read:gastspeicherLaden,save:gastreiseSpeichern};`,resolveDir:process.cwd()},bundle:true,platform:'browser',write:false})
const seed=bundled.outputFiles[0].text,browser=await chromium.launch({headless:true,channel:'chrome'})
const results=[],errors=[],external=[],posts=[]
const conflictEvidence={}
let page,status='FAIL',failure
const check=async(name,fn)=>{console.log('RUN '+name);await fn();results.push({name,status:'PASS'});console.log('PASS '+name)}
const stored=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('jetnity:reise:v3')))
const open=async()=>{await page.getByRole('button',{name:'Reise ändern',exact:true}).click();await page.getByRole('form',{name:'Reise direkt bearbeiten',exact:true}).waitFor()}
const preview=async()=>{await page.getByRole('button',{name:'Auswirkungen ansehen',exact:true}).click();await page.getByRole('heading',{name:'Auswirkungen prüfen',exact:true}).waitFor();await page.waitForFunction(()=>document.activeElement?.textContent==='Auswirkungen prüfen' && !document.querySelector('[data-aenderung-sperre="true"]'))}
const saved=async()=>{await page.getByRole('button',{name:'Änderung ausdrücklich übernehmen',exact:true}).click();await page.getByRole('heading',{name:'Änderung gespeichert und bestätigt',exact:true}).waitFor()}
try {
 for(const width of [360,390,768,1440]) {
  const ctx=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'})
  await ctx.route('**/*',route=>{const u=new URL(route.request().url());if(u.origin!==base){external.push(u.origin);return route.abort()}if(route.request().method()==='POST')posts.push(u.pathname);return route.continue()})
  page=await ctx.newPage();page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message))
  await page.goto(`${base}/reisen/trip-fixture`);await page.addScriptTag({content:seed});await page.evaluate(()=>window.directAudit.seed());await page.goto(`${base}/reisen/trip-direct-fixture`)
  await open()
  const initial=await stored()
  for(const zoom of [1,2]) {
   await page.evaluate(z=>document.documentElement.style.fontSize=`${16*z}px`,zoom)
   await check(`Production form ${width}px / ${zoom*100}% text, reduced motion, focus and no overflow`,async()=>{
    assert(await page.getByLabel('Reisetitel',{exact:true}).isVisible())
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'document overflow')
    const dims=await page.getByRole('form',{name:'Reise direkt bearbeiten'}).evaluate(el=>({scroll:el.scrollWidth,client:el.clientWidth,offenders:[...el.querySelectorAll('*')].filter(x=>x.scrollWidth>x.clientWidth+1).slice(0,8).map(x=>({tag:x.tagName,text:x.textContent.slice(0,40),s:x.scrollWidth,c:x.clientWidth}))}));assert(dims.scroll<=dims.client+1,JSON.stringify(dims))
    const controls=await page.getByRole('form',{name:'Reise direkt bearbeiten'}).locator('button,input:not([type=checkbox]),select,textarea').evaluateAll(a=>a.filter(x=>x.getClientRects().length).every(x=>x.getBoundingClientRect().height>=43))
    assert(controls,'small controls')
   })
   if(zoom===2&&width===360||zoom===1&&[390,1440].includes(width))await page.screenshot({path:`${dir}/screens/direct-${width}-text-${zoom*100}.png`,fullPage:true})
  }
  await page.evaluate(()=>document.documentElement.style.fontSize='16px')
  await check(`Keyboard, field-linked error, cancel/no write at ${width}`,async()=>{
   const title=page.getByLabel('Reisetitel',{exact:true});await title.focus();await page.keyboard.press('ControlOrMeta+A');await page.keyboard.press('Backspace')
   await page.getByRole('button',{name:'Auswirkungen ansehen'}).click();assert.equal(await title.getAttribute('aria-invalid'),'true');assert(await title.getAttribute('aria-describedby'))
   assert.equal(await page.getByRole('button',{name:'Änderung ausdrücklich übernehmen'}).count(),0)
   await title.fill('Nur ein Entwurf');await preview();await page.keyboard.press('Escape');await page.getByRole('heading',{name:'Auswirkungen prüfen'}).waitFor({state:'detached'})
   assert.deepEqual(await stored(),initial);await open();assert.equal(await title.inputValue(),initial.title)
  })
  if(width!==390){await ctx.close();continue}
  await check('All basic fields preserve literal user text; explicit confirmation/readback/reload',async()=>{
   await page.getByLabel('Reisetitel',{exact:true}).fill('Direkt bestätigt')
   await page.getByLabel('Budgetziel (CHF)').fill('999.95')
   await page.getByLabel('Reisetempo').selectOption('calm')
   await page.getByLabel(/^Reisewunsch/).fill('Mein Budget von CHF 123 bleibt wörtlich.')
   await preview();assert.deepEqual(await stored(),initial)
   await page.getByText('Grunddaten und Zeitraum (',{exact:false}).click()
   await page.locator('[aria-label="Vollständige Auswirkungen"] li').filter({hasText:'CHF 123'}).waitFor()
   await saved();const after=await stored();assert.equal(after.budgetAmount,999.95);assert.equal(after.travelWish,'Mein Budget von CHF 123 bleibt wörtlich.');assert.deepEqual(after.days,initial.days);assert.deepEqual(after.stages,initial.stages)
   await page.reload();await open();assert.equal(await page.getByLabel('Reisetitel',{exact:true}).inputValue(),'Direkt bestätigt')
  })
  await check('Production compound date shift and identified stage duration show and save exact ranges',async()=>{
   const before=await stored();await page.getByLabel(/^Reisebeginn/).fill('2026-10-09');await page.getByLabel('Dauer bearbeiten').selectOption('etappen');await page.getByLabel('Tage für Etappe 1',{exact:true}).fill('3');await preview()
   await page.locator('summary').filter({hasText:'Grunddaten und Zeitraum'}).click();await page.locator('[aria-label="Vollständige Auswirkungen"] li').filter({hasText:/^Reise:.*2026-10-13/}).waitFor();await saved();const after=await stored();assert.equal(after.days.length,5);assert.equal(after.startDate,'2026-10-09');assert.equal(after.endDate,'2026-10-13');assert.equal(after.days[0].items[0].startsOn,'2026-10-11');assert.deepEqual(after.days.at(-1).items,before.days.at(-1).items)
   await page.reload();await open()
  })
  await check('Real disabled free-text server action leaves manual mode usable',async()=>{
   await page.getByRole('button',{name:'In eigenen Worten',exact:true}).click();await page.getByLabel('Dein Änderungswunsch').fill('Mach die Reise zwei Tage länger.')
   await page.getByRole('button',{name:'Änderung vorschlagen',exact:true}).click();await page.getByRole('alert').filter({hasText:/abgeschaltet|nicht aktiviert|nicht verfügbar|nicht freigegeben/}).waitFor()
   await page.getByRole('button',{name:'Direkt bearbeiten',exact:true}).click();await page.getByLabel('Reisetitel',{exact:true}).fill('Nach Modellfehler direkt');await preview();await saved()
  })
  await check('Complete keyboard-only edit, preview, confirm and visible success focus',async()=>{
   await page.reload()
   const reach=async label=>{for(let n=0;n<150;n++){if(await page.evaluate(label=>document.activeElement?.textContent?.trim()===label,label))return;await page.keyboard.press('Tab')}throw Error('Keyboard target not reached: '+label)}
   await reach('Reise ändern');await page.keyboard.press('Enter');await page.waitForFunction(()=>document.activeElement?.tagName==='INPUT')
   await page.keyboard.press('ControlOrMeta+A');await page.keyboard.type('Nur mit Tastatur bestätigt');await reach('Auswirkungen ansehen');await page.keyboard.press('Enter');await page.waitForFunction(()=>document.activeElement?.textContent==='Auswirkungen prüfen')
   await reach('Änderung ausdrücklich übernehmen');await page.keyboard.press('Enter');await page.getByRole('heading',{name:'Änderung gespeichert und bestätigt',exact:true}).waitFor();await page.waitForFunction(()=>document.activeElement?.textContent==='Änderung gespeichert und bestätigt');assert.equal((await stored()).title,'Nur mit Tastatur bestätigt')
  })
  await check('Browser storage full produces uncertainty, preserves proposal, safely retries once storage recovers',async()=>{
   await page.getByRole('button',{name:'Weitere Änderung vorbereiten'}).click();await page.getByLabel('Reisetitel',{exact:true}).fill('Nach Speicherfehler bestätigt');await preview();const before=await stored()
   await page.evaluate(()=>{window.originalStorageSet=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw new DOMException('Synthetic quota','QuotaExceededError')}})
   await page.getByRole('button',{name:'Änderung ausdrücklich übernehmen'}).click();await page.getByRole('button',{name:'Ergebnis erneut prüfen'}).waitFor();assert.equal((await stored()).revision,before.revision)
   await page.evaluate(()=>Storage.prototype.setItem=window.originalStorageSet);await page.getByRole('button',{name:'Dieselbe Änderung erneut übernehmen'}).click();await page.getByRole('heading',{name:'Änderung gespeichert und bestätigt',exact:true}).waitFor();assert.equal((await stored()).revision,before.revision+1)
  })
  await check('Same-revision different active Guest trip rejects old accepted proposal',async()=>{
   await page.getByRole('button',{name:'Weitere Änderung vorbereiten'}).click();await page.getByLabel('Reisetitel',{exact:true}).fill('Darf fremde Reise nicht ändern');await preview()
   const before=await stored()
   await page.evaluate(()=>{window.originalDigest=crypto.subtle.digest.bind(crypto.subtle);window.digestHeld=false;crypto.subtle.digest=async(...args)=>{window.digestHeld=true;await new Promise(resolve=>window.releaseDigest=resolve);crypto.subtle.digest=window.originalDigest;return window.originalDigest(...args)}})
   await page.getByRole('button',{name:'Änderung ausdrücklich übernehmen'}).click();await page.waitForFunction(()=>window.digestHeld)
   assert(await page.getByRole('button',{name:'Änderung ausdrücklich übernehmen'}).isDisabled())
   await page.evaluate(()=>{const t=JSON.parse(localStorage.getItem('jetnity:reise:v3'));localStorage.setItem('jetnity:reise:v3',JSON.stringify({...t,id:'different-active-trip'}));window.releaseDigest()})
   await page.getByRole('alert').filter({hasText:/ursprüngliche Reise|inzwischen geändert/}).waitFor();assert.equal((await stored()).id,'different-active-trip');assert.equal((await stored()).title,before.title)
  })
  await ctx.close()
 }
 const conflictContext=await browser.newContext({viewport:{width:390,height:900}});page=await conflictContext.newPage();page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message))
 let conflictPosts=0
 await conflictContext.route('**/*',route=>{const u=new URL(route.request().url());if(u.origin!==base){external.push(u.origin);return route.abort()}if(route.request().method()==='POST')conflictPosts++;return route.continue()})
 await page.goto(`${base}/reisen/trip-fixture`);await page.addScriptTag({content:seed});await page.evaluate(()=>window.directAudit.seedConflict());await page.goto(`${base}/reisen/trip-direct-fixture`);await open()
 await check('R1 actual conflict preview is prospective; preview/back/cancel make zero writes; only confirmation saves',async()=>{
  const before=await stored()
  await page.evaluate(()=>{window.conflictWrites=0;for(const method of ['setItem','removeItem','clear']){const original=Storage.prototype[method];Storage.prototype[method]=function(...args){if(this===localStorage&&(method==='clear'||args[0]==='jetnity:reise:v3'))window.conflictWrites++;return original.apply(this,args)}}})
  await page.getByLabel(/^Reisebeginn/).fill('2026-10-09');await preview()
  const temporal=page.locator('details').filter({has:page.getByText(/^Zeitprüfung des vorgeschlagenen Plans/)});await temporal.locator('summary').click()
  const row=temporal.locator('li').filter({hasText:'Überschneidung'});await row.waitFor()
  const text=await row.innerText();assert.match(text,/mögliche Überschneidung im vorgeschlagenen Plan\./);assert.doesNotMatch(text,/gespeichert|bestätigt|nachgewiesene/)
  assert(text.includes('Verschiebbarer Transfer')&&text.includes('Fest gebuchter Transfer'))
  assert.equal(await page.getByRole('heading',{name:'Änderung gespeichert und bestätigt',exact:true}).count(),0)
  assert.deepEqual(await stored(),before);assert.equal(await page.evaluate(()=>window.conflictWrites),0);assert.equal(conflictPosts,0)
  Object.assign(conflictEvidence,{renderedConflict:text,previewWrites:0,previewPosts:conflictPosts,previewGraphUnchanged:true,previewSuccessHeadingAbsent:true})
  await page.screenshot({path:`${dir}/screens/r1-conflict-preview.png`,fullPage:true})
  await page.getByRole('button',{name:'Zurück zur Eingabe',exact:true}).click();assert.equal(await page.getByLabel(/^Reisebeginn/).inputValue(),'2026-10-09');assert.deepEqual(await stored(),before)
  await preview();await page.keyboard.press('Escape');await page.getByRole('heading',{name:'Auswirkungen prüfen'}).waitFor({state:'detached'})
  assert.deepEqual(await stored(),before);assert.equal(await page.evaluate(()=>window.conflictWrites),0);assert.equal(conflictPosts,0)
  Object.assign(conflictEvidence,{cancelWrites:0,cancelPosts:conflictPosts,cancelGraphUnchanged:true})
  await open();assert.equal(await page.getByLabel(/^Reisebeginn/).inputValue(),'2026-10-07');await page.getByLabel(/^Reisebeginn/).fill('2026-10-09');await preview();await saved()
  const after=await stored();assert.equal(after.startDate,'2026-10-09');assert.equal(after.revision,before.revision+1);assert.deepEqual(after.days[0].items[1],before.days[0].items[1]);assert.equal(await page.evaluate(()=>window.conflictWrites),1)
  await page.reload();await open();assert.equal(await page.getByLabel(/^Reisebeginn/).inputValue(),'2026-10-09')
  Object.assign(conflictEvidence,{confirmedWrites:1,confirmedReadbackAndReload:true,protectedBookingUnchanged:true})
 });await conflictContext.close()
 const flexContext=await browser.newContext({viewport:{width:390,height:900}});page=await flexContext.newPage();page.setDefaultTimeout(15000)
 await page.goto(`${base}/reisen/trip-fixture`);await page.addScriptTag({content:seed});await page.evaluate(()=>window.directAudit.seed(false,true));await page.goto(`${base}/reisen/trip-direct-fixture`);await open()
 await check('Production flexible trip gets first civil start date and total duration without changing explicit point dates',async()=>{
  const before=await stored();await page.getByLabel(/^Reisebeginn/).fill('2026-10-08');await page.getByLabel('Gesamtdauer in Tagen').fill('5');await preview();await saved();const after=await stored();assert.equal(after.endDate,'2026-10-12');assert.equal(after.days.length,5);assert.equal(after.days[0].items[0].startsOn,before.days[0].items[0].startsOn)
 });await flexContext.close()
 const linkedContext=await browser.newContext({viewport:{width:390,height:900}});page=await linkedContext.newPage();page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message))
 await linkedContext.route('**/*',route=>{const u=new URL(route.request().url());if(u.origin!==base){external.push(u.origin);return route.abort()}if(route.request().method()==='POST')posts.push(u.pathname);return route.continue()})
 await page.goto(`${base}/reisen/trip-fixture`);await page.addScriptTag({content:seed});await page.evaluate(()=>window.directAudit.seed(false,false,true));await page.goto(`${base}/reisen/trip-direct-fixture`);await open()
 await check('A09 v1.1 Guest linked removal refuses with zero writes, full preservation and editable draft',async()=>{
  const before=await stored();await page.evaluate(()=>{window.directWrites=0;const original=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key==='jetnity:reise:v3')window.directWrites++;return original.call(this,key,value)}})
  await page.getByLabel('Reisetitel',{exact:true}).fill('Erhaltener Entwurf');await page.getByLabel('Dauer bearbeiten').selectOption('etappen');await page.getByLabel('Etappe 2 entfernen',{exact:true}).check();await page.getByRole('button',{name:'Auswirkungen ansehen'}).click()
  await page.getByRole('alert').filter({hasText:/verknüpfte Vorbereitungen/}).waitFor();assert.equal(await page.getByRole('button',{name:'Änderung ausdrücklich übernehmen'}).count(),0);assert.equal(await page.getByLabel('Reisetitel',{exact:true}).inputValue(),'Erhaltener Entwurf');assert(await page.getByLabel('Etappe 2 entfernen',{exact:true}).isChecked());assert.deepEqual(await stored(),before);assert.equal(await page.evaluate(()=>window.directWrites),0)
 })
 await check('A09 v1.1 Guest unrelated edit on the referenced trip still saves and independently reloads',async()=>{
  const before=await stored();await page.getByLabel('Etappe 2 entfernen',{exact:true}).uncheck();await preview();await saved();const after=await stored();assert.equal(after.title,'Erhaltener Entwurf');assert.equal(after.revision,before.revision+1);assert.deepEqual(after.readinessItems,before.readinessItems);assert.deepEqual(after.days,before.days);assert.deepEqual(after.stages,before.stages);await page.reload();await open();assert.equal(await page.getByLabel('Reisetitel',{exact:true}).inputValue(),'Erhaltener Entwurf');assert.deepEqual((await stored()).readinessItems,before.readinessItems)
 });await linkedContext.close()
 const ctx=await browser.newContext({viewport:{width:390,height:900}});page=await ctx.newPage();page.setDefaultTimeout(15000)
 await page.goto(`${base}/reisen/trip-fixture`);await page.addScriptTag({content:seed});await page.evaluate(()=>window.directAudit.seed(true));await page.goto(`${base}/reisen/trip-direct-fixture`);await open()
 await check('1000-point graph: every removed/protected point inspectable, hidden pages bounded',async()=>{
  await page.getByLabel('Dauer bearbeiten').selectOption('etappen');await page.getByLabel('Etappe 2 entfernen',{exact:true}).check();await preview()
  const removed=page.locator('details').filter({has:page.getByText('Normale Planpunkte, die entfernt würden (250)',{exact:true})});await removed.locator('summary').click();await removed.locator('li').first().waitFor();assert.equal(await removed.locator('li').count(),20)
  let seen=await removed.locator('li').allTextContents()
  for(let index=1;index<13;index++){await removed.getByRole('button',{name:'Weitere Einträge'}).click();await page.waitForFunction(({index})=>[...document.querySelectorAll('details[open] span')].some(s=>s.textContent.startsWith(String(index*20+1)+'–')),{index});seen.push(...await removed.locator('li').allTextContents())};assert(await removed.getByRole('button',{name:'Weitere Einträge'}).isDisabled())
  assert.equal(new Set(seen).size,250);await page.screenshot({path:`${dir}/screens/large-preview.png`,fullPage:true})
  const protectedGroup=page.locator('details').filter({has:page.getByText('Geschützte Planpunkte mit betroffenem Reisezeitraum oder Tageskontext (250)',{exact:true})});await protectedGroup.locator('summary').click();await protectedGroup.locator('li').first().waitFor();assert.equal(await protectedGroup.locator('li').count(),20)
  await saved();const after=await stored();assert.equal(after.days.length,2);assert.equal(after.ohneTag.length,250);assert.equal(after.stages.length,1)
 })
 await ctx.close();assert.deepEqual(errors,[]);assert.deepEqual(external,[]);status='PASS'
} catch(e){failure=String(e.message);console.error(failure);if(page)console.error(await page.evaluate(()=>({active:document.activeElement?.outerHTML?.slice(0,450),alerts:[...document.querySelectorAll('[role=alert]')].map(e=>e.textContent)})).catch(()=>null));if(page)await page.screenshot({path:`${dir}/screens/guest-diagnostic.png`,fullPage:true}).catch(()=>{});process.exitCode=1}
finally{await browser.close();writeFileSync(`${dir}/guest-browser.json`,JSON.stringify({status,environment:{browser:browser.version(),node:process.version},results,conflictEvidence,failure,errors,externalRequests:external,explicitFreeTextPosts:posts.length,boundary:'Production routes/components, actual browser storage; synthetic seed only; no physical device/WebKit/screen-reader run'},null,2)+'\n');console.log(`${status}: ${results.length} Guest browser cases`)}
