import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
import {mkdirSync,writeFileSync} from 'node:fs'
import {chromium} from 'playwright'
const require=createRequire(import.meta.url),{build}=createRequire(require.resolve('tsx'))('esbuild')
const dir='docs/evidence/trip-workspace-contextual-editing-ux-1/edges',base='http://127.0.0.1:3517'
mkdirSync(dir,{recursive:true})
const bundle=await build({stdin:{contents:`import {fixture} from './scripts/direct-trip-editing-1/fixture';import {gastreiseSpeichern} from './lib/trips/gastspeicher';window.seed=()=>gastreiseSpeichern(fixture());`,resolveDir:process.cwd()},bundle:true,platform:'browser',write:false})
const browser=await chromium.launch({headless:true,channel:'chrome'}),results=[]
const ctx=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'}),page=await ctx.newPage();page.setDefaultTimeout(15000)
const seed=async query=>{await page.goto(`${base}/reisen/trip-fixture`);await page.addScriptTag({content:bundle.outputFiles[0].text});await page.evaluate(()=>window.seed());await page.goto(`${base}/reisen/trip-direct-fixture${query}`);await page.getByRole('button',{name:'Reise ändern',exact:true}).waitFor()}
const open=async()=>{await page.getByRole('button',{name:'Reise ändern',exact:true}).click();await page.getByLabel('Reisetitel',{exact:true}).waitFor()}
const test=async(name,fn)=>{console.log('RUN '+name);await fn();results.push({name,status:'PASS'});console.log('PASS '+name)}
let failure
try{
 await test('Multi-entry browser Back closes editing and restores the selected historical Workspace mode',async()=>{
  await seed('');await page.getByRole('button',{name:'Reiseplan',exact:true}).click();await page.waitForFunction(()=>document.querySelector('[data-workspace-ansicht]')?.getAttribute('data-workspace-ansicht')==='plan');await open();await page.evaluate(()=>history.go(-2));await page.getByRole('dialog').waitFor({state:'detached'});await page.waitForFunction(()=>document.querySelector('[data-workspace-ansicht]')?.getAttribute('data-workspace-ansicht')==='uebersicht',null,{timeout:5000});assert.equal(new URL(page.url()).searchParams.get('ansicht'),null)
 })
 await test('Removed active day returns to canonical saved context by visible close and browser Back, preserving foreign query/hash',async()=>{
  for(const close of ['visible','browser']){
   await seed('?ansicht=plan&tag=day-4&foreign=keep#keep');await open();await page.getByRole('button',{name:'2. Zeitraum'}).click();await page.getByLabel(/^Gesamtdauer in Tagen/).fill('2');await page.getByRole('button',{name:'Auswirkungen ansehen'}).click();await page.getByRole('button',{name:'Änderung ausdrücklich übernehmen'}).click();await page.getByRole('heading',{name:'Änderung gespeichert und bestätigt'}).waitFor()
   await page.waitForFunction(()=>new URL(location.href).searchParams.get('tag')!=='day-4');const canonical=page.url()
   if(close==='visible')await page.getByRole('button',{name:'Zur gespeicherten Reise'}).click();else await page.goBack()
   await page.getByRole('dialog').waitFor({state:'detached'});assert.equal(page.url(),canonical,'return must retain the committed graph canonical context');assert.equal(new URL(page.url()).searchParams.get('foreign'),'keep');assert.equal(new URL(page.url()).hash,'#keep')
   await page.reload();await page.getByRole('button',{name:'Reise ändern',exact:true}).waitFor();assert.equal(page.url(),canonical)
  }
 })
 await test('Refresh/Forward reopen no draft and restore four-mode navigation without stale modal history',async()=>{
  await seed('?ansicht=plan&tag=day-2');await open();await page.getByLabel('Reisetitel',{exact:true}).fill('Unsaved draft');await page.reload();await page.getByRole('button',{name:'Reise ändern',exact:true}).waitFor();assert.equal(await page.getByRole('dialog').count(),0);assert.equal(await page.evaluate(()=>document.body.style.overflow),'');await open();assert.equal(await page.getByLabel('Reisetitel',{exact:true}).inputValue(),'Synthetische Reise');await page.keyboard.press('Escape');await page.getByRole('dialog').waitFor({state:'detached'});await page.goForward();assert.equal(await page.getByRole('dialog').count(),0);await page.getByRole('button',{name:'Übersicht',exact:true}).click();assert.equal(new URL(page.url()).searchParams.get('ansicht'),null)
 })
 await test('Accessibility tree, safe-area padding, short visual viewport and reachable controls',async()=>{
  await seed('?ansicht=plan&tag=day-2');await open();const cdp=await ctx.newCDPSession(page);await cdp.send('Accessibility.enable');const tree=await cdp.send('Accessibility.getFullAXTree');const nodes=tree.nodes.filter(n=>!n.ignored).map(n=>({role:n.role?.value,name:n.name?.value,properties:n.properties?.filter(p=>['modal','focused','current','invalid','live'].includes(p.name)).map(p=>({name:p.name,value:p.value?.value}))}));assert(nodes.some(n=>n.role==='dialog'&&n.name==='Reise ändern'&&n.properties.some(p=>p.name==='modal'&&p.value===true)));assert(!nodes.some(n=>n.role==='navigation'&&n.name==='Reiseansicht'));writeFileSync(`${dir}/accessibility.json`,JSON.stringify({nodes,boundary:'Chromium accessibility tree inspection, no screen-reader session'},null,2)+'\n')
  // Synthetic insets exercise layout behavior; hardware env(safe-area-inset-*) is not claimed.
  await page.evaluate(()=>{const d=document.querySelector('dialog');d.style.paddingTop='44px';d.style.paddingBottom='34px';d.style.paddingLeft='10px';d.style.paddingRight='10px'})
  await page.setViewportSize({width:390,height:430});await page.getByLabel('Reisetitel',{exact:true}).fill('Safe area draft');await page.getByRole('button',{name:'Auswirkungen ansehen'}).click();await page.getByRole('heading',{name:'Auswirkungen prüfen'}).waitFor();await page.waitForFunction(()=>document.activeElement?.textContent==='Auswirkungen prüfen');assert(await page.evaluate(()=>{const r=document.activeElement.getBoundingClientRect(),d=document.querySelector('dialog').getBoundingClientRect();return r.top>=d.top+44&&r.bottom<d.bottom}));await page.getByRole('button',{name:'Zurück zur Eingabe'}).click();await page.getByLabel('Reisetitel',{exact:true}).waitFor();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);await page.screenshot({path:`${dir}/390-short-safe-area.png`});await page.keyboard.press('Escape')
 })
}catch(e){failure=e.message;console.error(e);await page.screenshot({path:`${dir}/failure.png`});process.exitCode=1}
finally{await browser.close();writeFileSync(`${dir}/edges.json`,JSON.stringify({status:failure?'FAIL':'PASS',failure,results},null,2)+'\n')}
