// Production Plan + Editor and actual Guest storage, with an explicit response-delivery gate.
// Guest writes themselves are synchronous; this fixture does not claim network Guest latency.
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { writeFileSync } from 'node:fs'
import { chromium } from 'playwright'
import { assertPendingForms, probePendingForm } from './pending-form.mjs'
const require=createRequire(import.meta.url),{build}=createRequire(require.resolve('tsx'))('esbuild')
const base=process.env.AUDIT_BASE||'http://127.0.0.1:3507'
assert(['127.0.0.1','localhost'].includes(new URL(base).hostname))
const bundle=await build({stdin:{contents:`
import React from 'react';import {createRoot} from 'react-dom/client';
import TripWorkspacePlan from './components/trips/TripWorkspacePlan';
import {gastreiseAnlegen,gastreiseLadenNach,gastPlanpunktAnlegen,gastPlanpunktBearbeiten} from './lib/trips/gastspeicher';
localStorage.clear();
const trip=gastreiseAnlegen({clientRef:'trip-'+crypto.randomUUID(),title:'Synthetic pending Guest',destination:'Florenz',destinationPlaceId:'geonames:3176959',origin:'Zürich',originPlaceId:'geonames:2657896',startDate:'2026-10-07',endDate:'2026-10-09',travellers:1,currency:'CHF',budgetAmount:null,pace:'balanced',interests:[],travelWish:null});
let gate=Promise.resolve(),release=()=>{},fail=false;
const host=document.createElement('section');host.dataset.pendingFixture='';document.body.append(host);const root=createRoot(host);
window.pendingFixture={held:false,settled:0,arm:(failure=false)=>{fail=failure;window.pendingFixture.held=false;gate=new Promise(resolve=>release=resolve)},release:()=>release(),read:()=>gastreiseLadenNach(trip.id),unmount:()=>root.unmount()};
function Fixture(){
 const [graph,setGraph]=React.useState(trip),[day,setDay]=React.useState(trip.days[0].id);
 const write=async fn=>{let error=null;const original=Storage.prototype.setItem;
  try {if(fail)Storage.prototype.setItem=function(){throw new DOMException('Synthetic quota','QuotaExceededError')};setGraph(fn())}
  catch(e){error=e.message}finally{Storage.prototype.setItem=original}
  window.pendingFixture.held=true;await gate;window.pendingFixture.settled++;return error;
 };
 return <TripWorkspacePlan reise={graph} ohneTag={graph.unassignedItems??[]} aktiverTag={day} kompakt={false} onTagWechseln={setDay}
  onPunktAnlegen={(tagId,values)=>write(()=>gastPlanpunktAnlegen(graph,{...values,dayId:tagId}))}
  onPunktBearbeiten={(original,change)=>write(()=>gastPlanpunktBearbeiten(graph,original,change))}
  onPunktEntfernen={async()=>{throw Error('Delete is outside this fixture')}}/>;
}root.render(<Fixture/>);
`,loader:'tsx',resolveDir:process.cwd()},bundle:true,write:false,platform:'browser',define:{'process.env.NODE_ENV':'"production"'}})
const browser=await chromium.launch({headless:true,channel:'chrome'}),pending=[],guards=[],errors=[]
let status='FAIL',failure
try {
 const ctx=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'}),page=await ctx.newPage()
 page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message))
 await ctx.route('**/*',r=>new URL(r.request().url()).origin===base?r.continue():r.abort())
 await page.goto(`${base}/reisen/trip-pending-fixture`);await page.addScriptTag({content:bundle.outputFiles[0].text})
 const plan=page.locator('[data-pending-fixture]')
 const read=()=>page.evaluate(()=>window.pendingFixture.read())
 const save=async(form,name,fail=false)=>{
  await page.evaluate(f=>window.pendingFixture.arm(f),fail)
  await form.getByRole('button',{name:'Speichern',exact:true}).click();await page.waitForFunction(()=>window.pendingFixture.held)
  try {pending.push(await probePendingForm(page,form,name))}finally{await page.evaluate(()=>window.pendingFixture.release())}
 }
 await plan.locator('[data-plan-hinzufuegen]').click()
 let form=plan.getByRole('form')
 await form.getByLabel('Ort oder Aktivität').fill('Guest pending A')
 await save(form,'create success / Art and content');await form.waitFor({state:'detached'});pending.at(-1).closedAfterSuccess=true
 let saved=(await read()).days[0].items[0];assert.equal(saved.title,'Guest pending A')
 pending.at(-1).persistedTitle=saved.title
 await plan.getByRole('button',{name:'Guest pending A bearbeiten',exact:true}).click();form=plan.getByRole('form')
 await form.getByLabel('Notiz, optional').fill('Saved note A')
 await save(form,'edit success / day assignment and content');await form.waitFor({state:'detached'});pending.at(-1).closedAfterSuccess=true
 saved=(await read()).days[0].items[0];assert.equal(saved.title,'Guest pending A');assert.equal(saved.note,'Saved note A')
 await plan.getByRole('button',{name:'Guest pending A bearbeiten',exact:true}).click();form=plan.getByRole('form')
 await form.getByLabel('Ort oder Aktivität').fill('Guest error draft A')
 await save(form,'edit failure / actual Guest quota exception',true);await form.getByRole('alert').waitFor()
 pending.at(-1).afterError=await form.getByLabel('Ort oder Aktivität').inputValue()
 assert.equal(pending.at(-1).afterError,pending.at(-1).during)
 assert.equal(await form.locator('input,select,textarea').evaluateAll(nodes=>nodes.every(el=>!el.matches(':disabled'))),true)
 assert.equal(await form.getAttribute('aria-busy'),'false')
 assert(!(await plan.getByRole('status').allTextContents()).some(s=>s.includes('Planpunkt gespeichert')))
 assert.deepEqual((await read()).days[0].items[0],saved)
 await page.keyboard.press('Escape');await form.waitFor({state:'detached'})
 // Pending old edit -> another editor on the same day; old completion cannot close it.
 for(const switchDay of [false,true]){
  await plan.getByRole('button',{name:'Guest pending A bearbeiten',exact:true}).click();form=plan.getByRole('form')
  await page.evaluate(()=>window.pendingFixture.arm())
  await form.getByRole('button',{name:'Speichern',exact:true}).click();await page.waitForFunction(()=>window.pendingFixture.held)
  const before=await page.evaluate(()=>window.pendingFixture.settled)
  if(switchDay)await plan.locator('[data-plan-tag-naechster]').click()
  // On the same day Add toggles the old editor closed; a second click opens a fresh one.
  await plan.locator('[data-plan-hinzufuegen]').click()
  if(!switchDay)await plan.locator('[data-plan-hinzufuegen]').click()
  const newer=plan.getByRole('form',{name:'Punkt hinzufügen',exact:true})
  await newer.getByLabel('Ort oder Aktivität').fill('New Guest draft survives')
  await page.evaluate(()=>window.pendingFixture.release());await page.waitForFunction(n=>window.pendingFixture.settled>n,before)
  assert.equal(await newer.getByLabel('Ort oder Aktivität').inputValue(),'New Guest draft survives')
  assert(!(await plan.getByRole('status').allTextContents()).some(s=>s.includes('Planpunkt gespeichert')))
  guards.push({name:switchDay?'other day / unmounted old editor / new draft':'other editor on same day / unmounted old editor',status:'PASS'})
  await page.keyboard.press('Escape');await newer.waitFor({state:'detached'})
 }
 await plan.locator('[data-plan-hinzufuegen]').click();form=plan.getByRole('form')
 await form.getByLabel('Ort oder Aktivität').fill('Unmounted save A');await page.evaluate(()=>window.pendingFixture.arm())
 await form.getByRole('button',{name:'Speichern',exact:true}).click();await page.waitForFunction(()=>window.pendingFixture.held)
 await page.evaluate(()=>{window.pendingFixture.unmount();window.pendingFixture.release()})
 assert.equal(await plan.getByRole('form').count(),0)
 assert((await read()).days.flatMap(d=>d.items).some(p=>p.title==='Unmounted save A'))
 guards.push({name:'whole Plan unmount / late completion / actual storage readback',status:'PASS'})
 assert.deepEqual(errors,[])
 assertPendingForms(pending)
 status='PASS';await ctx.close()
} catch(error){failure=String(error.message);console.error(failure)}
finally {writeFileSync('docs/evidence/trip-plan-integrated-operating-experience-1/r1-guest-editor.json',JSON.stringify({status,failure,boundary:'Production Plan/Editor mounted in owned browser fixture with actual Guest persistence. Only response delivery delayed; real production route covered by browser.mjs.',pending,guards,errors},null,2)+'\n');await browser.close();if(status!=='PASS')process.exitCode=1}
