import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdirSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright'
const require=createRequire(import.meta.url),{build}=createRequire(require.resolve('tsx'))('esbuild')
const base='http://127.0.0.1:3517',dir='docs/evidence/trip-workspace-contextual-editing-ux-1/journey'
mkdirSync(dir,{recursive:true})
const bundle=await build({stdin:{contents:`import {fixture} from './scripts/direct-trip-editing-1/fixture';import {gastreiseSpeichern} from './lib/trips/gastspeicher';window.seed=()=>gastreiseSpeichern(fixture());`,resolveDir:process.cwd()},bundle:true,platform:'browser',write:false})
const browser=await chromium.launch({headless:true,channel:'chrome'}),results=[],errors=[],outbound=[]
let page,failure
const check=async(name,run)=>{console.log('RUN '+name);const started=Date.now();await run();results.push({name,durationMs:Date.now()-started,status:'PASS'});console.log('PASS '+name)}
const saved=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('jetnity:reise:v3')))
const open=async()=>{await page.getByRole('button',{name:'Reise ändern',exact:true}).click();await page.getByRole('dialog',{name:'Reise ändern',exact:true}).waitFor();await page.getByLabel('Reisetitel',{exact:true}).waitFor()}
const preview=async()=>{await page.getByRole('button',{name:'Auswirkungen ansehen',exact:true}).click();await page.getByRole('heading',{name:'Auswirkungen prüfen',exact:true}).waitFor();await page.waitForFunction(()=>document.activeElement?.textContent==='Auswirkungen prüfen')}
try{
 for(const width of [360,390,768,1024,1440])for(const scale of [1,2]){
  const ctx=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'})
  await ctx.route('**/*',r=>{if(new URL(r.request().url()).origin!==base){outbound.push(new URL(r.request().url()).origin);return r.abort()}return r.continue()})
  page=await ctx.newPage();page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));let posts=0
  page.on('request',r=>{if(r.method()==='POST')posts++})
  await page.goto(`${base}/reisen/trip-fixture`);await page.addScriptTag({content:bundle.outputFiles[0].text});await page.evaluate(()=>window.seed());await page.goto(`${base}/reisen/trip-direct-fixture?ansicht=plan&tag=day-2`)
  await page.getByRole('button',{name:'Reise ändern',exact:true}).waitFor();await page.evaluate(s=>document.documentElement.style.fontSize=`${16*s}px`,scale)
  const before=await saved()
  await page.evaluate(()=>{window.writes=0;const original=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='jetnity:reise:v3')window.writes++;return original.call(this,k,v)}})
  await check(`${width}/${scale}: stored context, progressive groups, keyboard focus and scroll isolation`,async()=>{
   await open();const docY=await page.evaluate(()=>scrollY)
   assert(await page.evaluate(()=>document.querySelector('dialog').matches(':modal')),'surface is a native modal');await page.evaluate(()=>document.querySelector('[data-workspace-mode-nav] button')?.focus());assert(await page.evaluate(()=>document.querySelector('dialog').contains(document.activeElement)),'background rejects focus')
   const context=page.getByRole('complementary',{name:'Gespeicherter Reisekontext'});assert.match(await context.innerText(),/Reiseplan/);assert.match(await context.innerText(),/2026-10-07/)
   await page.getByLabel('Reisetitel',{exact:true}).fill('Entwurf bleibt privat');assert.match(await context.innerText(),/Synthetische Reise/);assert.doesNotMatch(await context.innerText(),/Entwurf bleibt privat/)
   await page.getByRole('button',{name:'2. Zeitraum',exact:true}).click();assert(await page.getByLabel('Reisetitel',{exact:true}).isHidden());await page.getByLabel(/^Reisebeginn/).fill('2026-10-08')
   await page.getByRole('button',{name:'3. Etappen',exact:true}).click();await page.getByLabel('Dauer über Etappen bearbeiten',{exact:true}).check();await page.getByLabel('Tage für Etappe 1',{exact:true}).fill('3')
   await page.getByRole('button',{name:'1. Grunddaten',exact:true}).click();assert.equal(await page.getByLabel('Reisetitel',{exact:true}).inputValue(),'Entwurf bleibt privat')
   for(let n=0;n<35;n++){
    await page.keyboard.press('Tab')
    let focus=await page.evaluate(()=>{const e=document.activeElement,d=document.querySelector('dialog[open]'),r=e.getBoundingClientRect(),b=d.getBoundingClientRect();return {tag:e.tagName,text:e.textContent?.slice(0,80),inside:d.contains(e),top:r.top,bottom:r.bottom,height:r.height,frameTop:b.top,frameBottom:b.bottom}})
    // Chromium may move Tab to browser chrome (BODY fallback), never a background control.
    if(!focus.inside&&focus.tag==='BODY'){await page.keyboard.press('Tab');focus=await page.evaluate(()=>{const e=document.activeElement,d=document.querySelector('dialog'),r=e.getBoundingClientRect(),b=d.getBoundingClientRect();return {inside:d.contains(e),top:r.top,bottom:r.bottom,frameTop:b.top,frameBottom:b.bottom}})}
    assert(focus.inside,'focus escaped modal '+JSON.stringify({n,...focus}));assert(focus.top>=focus.frameTop-1&&focus.bottom<=focus.frameBottom+1,'focused control clipped '+JSON.stringify(focus))
   }
   assert.equal(await page.evaluate(()=>scrollY),docY)
   await preview();assert.equal(await page.evaluate(()=>scrollY),docY);assert.equal(await page.evaluate(()=>window.writes),0);assert.equal(posts,0)
   const details=page.getByRole('region',{name:'Vollständige Auswirkungen'});assert.match(await details.innerText(),/Etappen/);assert.match(await details.innerText(),/Tage/)
   await page.getByRole('button',{name:'Zurück zur Eingabe',exact:true}).click();assert.equal(await page.getByLabel('Reisetitel',{exact:true}).inputValue(),'Entwurf bleibt privat')
   await page.keyboard.press('Escape');await page.getByRole('dialog').waitFor({state:'detached'})
   assert.equal(await page.evaluate(()=>document.activeElement?.textContent?.trim()),'Reise ändern');assert.equal(await page.evaluate(()=>scrollY),docY)
   assert.deepEqual(await saved(),before);assert.equal(await page.evaluate(()=>window.writes),0);assert.equal(posts,0)
   assert.equal(new URL(page.url()).searchParams.get('ansicht'),'plan');assert.equal(new URL(page.url()).searchParams.get('tag'),'day-2')
   await open();await page.goBack();await page.getByRole('dialog').waitFor({state:'detached'});assert.equal(new URL(page.url()).searchParams.get('ansicht'),'plan')
  })
  await check(`${width}/${scale}: no-op, field error and explicit confirmation return`,async()=>{
   await open();await page.getByRole('button',{name:'Auswirkungen ansehen',exact:true}).click();await page.getByRole('alert').filter({hasText:'Es gibt noch keine Änderung.'}).waitFor()
   await page.getByLabel('Reisetitel',{exact:true}).fill('');await page.getByRole('button',{name:'Auswirkungen ansehen',exact:true}).click();assert.equal(await page.getByLabel('Reisetitel',{exact:true}).getAttribute('aria-invalid'),'true')
   await page.getByLabel('Reisetitel',{exact:true}).fill('Bestätigte Reise');await preview();await page.getByRole('button',{name:'Änderung ausdrücklich übernehmen',exact:true}).click()
   await page.getByRole('heading',{name:'Änderung gespeichert und bestätigt',exact:true}).waitFor();assert.equal((await saved()).title,'Bestätigte Reise');assert.equal(await page.evaluate(()=>window.writes),1)
   await page.getByRole('button',{name:'Zur gespeicherten Reise',exact:true}).click();await page.getByRole('dialog').waitFor({state:'detached'});assert.equal(new URL(page.url()).searchParams.get('tag'),'day-2');assert.equal(await page.evaluate(()=>document.activeElement?.textContent?.trim()),'Reise ändern')
  })
  await ctx.close()
 }
 const ctx=await browser.newContext({viewport:{width:390,height:844}});page=await ctx.newPage()
 await page.goto(`${base}/reisen/trip-fixture`);await page.addScriptTag({content:bundle.outputFiles[0].text});await page.evaluate(()=>window.seed());await page.goto(`${base}/reisen/trip-direct-fixture`);await open()
 await check('Uncertain save: Escape, browser Back, close and background focus cannot discard; retry writes once',async()=>{
  await page.getByLabel('Reisetitel',{exact:true}).fill('Nach Unsicherheit bestätigt');await preview()
  await page.evaluate(()=>{window.originalSet=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw new DOMException('Synthetic quota','QuotaExceededError')}})
  await page.getByRole('button',{name:'Änderung ausdrücklich übernehmen',exact:true}).click();await page.getByRole('button',{name:'Ergebnis erneut prüfen'}).waitFor()
  assert(await page.getByRole('button',{name:'Zurück zum Workspace',exact:true}).isDisabled());await page.keyboard.press('Escape');await page.goBack();await page.getByRole('dialog').waitFor();assert.equal(await page.getByRole('heading',{name:'Änderung gespeichert und bestätigt'}).count(),0)
  await page.evaluate(()=>document.querySelector('[data-workspace-mode-nav] button').focus());assert(await page.evaluate(()=>document.querySelector('dialog').contains(document.activeElement)))
  const before=await saved();await page.evaluate(()=>Storage.prototype.setItem=window.originalSet);await page.getByRole('button',{name:'Dieselbe Änderung erneut übernehmen'}).click();await page.getByRole('heading',{name:'Änderung gespeichert und bestätigt'}).waitFor();assert.equal((await saved()).revision,before.revision+1)
  await page.getByRole('button',{name:'Zur gespeicherten Reise'}).click();await page.getByRole('dialog').waitFor({state:'detached'})
 });await ctx.close();assert.deepEqual(errors,[]);assert.deepEqual(outbound,[])
}catch(e){failure=e.message;console.error(e);if(page)await page.screenshot({path:`${dir}/failure.png`}).catch(()=>{});process.exitCode=1}
finally{await browser.close();writeFileSync(`${dir}/journey.json`,JSON.stringify({status:failure?'FAIL':'PASS',results,failure,errors,outbound,browser:browser.version(),boundary:'Production Guest UI and real localStorage, Chromium viewport/text emulation; no physical-device or screen-reader claim'},null,2)+'\n')}
