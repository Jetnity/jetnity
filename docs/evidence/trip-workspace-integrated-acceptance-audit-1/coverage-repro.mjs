import {chromium} from 'playwright'
import {fixture} from './fixtures.mjs'
import {writeFileSync} from 'node:fs'
import {dirname,join} from 'node:path'
import {fileURLToPath} from 'node:url'
import {createRequire} from 'node:module'
const require=createRequire(import.meta.url)
const {manuelleFlugRouteBauen}=require('../../../lib/trips/flug-manuell.ts')
const {flugAbdeckung}=require('../../../lib/trips/flug-abdeckung.ts')
const out=dirname(fileURLToPath(import.meta.url)),base='http://127.0.0.1:3487'
const browser=await chromium.launch({headless:true,channel:'chrome'}),runs=[]
for(const viewport of [{width:390,height:844},{width:1440,height:900}]){
 const ctx=await browser.newContext({viewport,reducedMotion:'reduce'})
 const blocked=[];await ctx.route('**/*',r=>new URL(r.request().url()).origin!==base||r.request().method()!=='GET'||new URL(r.request().url()).pathname.startsWith('/api/')?(blocked.push(r.request().url()),r.abort()):r.continue())
 await ctx.addInitScript(t=>{if(!localStorage.getItem('jetnity:reise:v3'))localStorage.setItem('jetnity:reise:v3',JSON.stringify(t))},fixture())
 const page=await ctx.newPage();page.setDefaultTimeout(8000)
 const run={viewport,blocked};runs.push(run)
 await page.goto(base+'/reisen/'+fixture().id+'?ansicht=organisieren&bereich=fluege',{waitUntil:'networkidle'})
 await page.getByRole('button',{name:'Flugroute ergänzen',exact:true}).click()
 const form=page.getByRole('form',{name:'Flugroute für Manueller Flug'})
 for(const [label,value] of [['Abflugflughafen (IATA)','NRT'],['Ankunftsflughafen (IATA)','LAX'],['Abflugdatum','2026-11-01'],['Abflugzeit (optional)','18:00'],['Ankunftsdatum','2026-11-01'],['Ankunftszeit (optional)','09:00']])await form.getByLabel(label,{exact:true}).fill(value)
 await form.getByRole('button',{name:'Speichern',exact:true}).click();await form.waitFor({state:'hidden'})
 await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))))
 const state=()=>page.evaluate(()=>{
  const b=document.querySelector('[data-workspace-arbeit="ein"]')
  const tr=[...document.querySelectorAll('button')].find(el=>el.textContent==='Flugroute ändern')
  const rect=el=>{if(!el)return null;const r=el.getBoundingClientRect();return {top:r.top,bottom:r.bottom}}
  return {activeTag:document.activeElement?.tagName,trigger:rect(tr),work:rect(b),status:[...document.querySelectorAll('[role=status]')].map(el=>el.textContent),scrollY}
 })
 run.afterSameDaySave=await state()
 run.coverageText=await page.getByRole('region',{name:'Deine Flüge'}).innerText()
 await page.getByRole('region',{name:'Deine Flüge'}).scrollIntoViewIfNeeded()
 await page.screenshot({path:join(out,'targeted',viewport.width+'-false-outbound-selected.png')})
 await page.getByRole('button',{name:'Als gebucht markieren',exact:true}).click()
 run.bookedText=await page.getByRole('region',{name:'Deine Flüge'}).innerText()
 await page.screenshot({path:join(out,'targeted',viewport.width+'-false-outbound-booked.png')})
 await page.getByRole('button',{name:'Flugroute ändern',exact:true}).click()
 await form.getByLabel('Abflugdatum',{exact:true}).fill('2026-11-02')
 await form.getByRole('button',{name:'Speichern',exact:true}).click();await form.waitFor({state:'hidden'})
 await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))))
 run.afterDateMovesToUnassigned=await state()
 run.unassignedText=await page.getByRole('region',{name:'Deine Flüge'}).innerText()
 await page.screenshot({path:join(out,'targeted',viewport.width+'-save-reclassification-focus.png')})
 await ctx.close()
}
const trip=fixture()
const item=trip.days[0].items.find(x=>x.kind==='flight')
Object.assign(item,manuelleFlugRouteBauen([{origin:'NRT',destination:'LAX',departureDate:'2026-11-01',departureTime:'18:00',arrivalDate:'2026-11-01',arrivalTime:'09:00'}]))
const guest=flugAbdeckung(trip)
const accountLike=structuredClone(trip)
const seg=accountLike.days[0].items.find(x=>x.kind==='flight').routeItinerary.legs[0].segments[0]
seg.origin.countryCode='JP';seg.origin.city='Tokyo';seg.destination.countryCode='US';seg.destination.city='Los Angeles'
writeFileSync(join(out,'coverage-repro.json'),JSON.stringify({checkedAt:new Date().toISOString(),note:'Synthetic local fixtures. accountLike is pure-function input with explicit route facts, NOT authenticated Account E2E.',runs,pure:{guest,accountLike:flugAbdeckung(accountLike)}},null,2)+'\n')
await browser.close()
console.log(runs.map(r=>({viewport:r.viewport,coverage:r.coverageText,booked:r.bookedText,afterSave:r.afterSameDaySave,afterReclassification:r.afterDateMovesToUnassigned})))
