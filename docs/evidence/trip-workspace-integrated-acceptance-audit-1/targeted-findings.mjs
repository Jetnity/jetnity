import {chromium} from 'playwright'
import {fixture} from './fixtures.mjs'
import {writeFileSync,mkdirSync} from 'node:fs'
import {dirname,join} from 'node:path'
import {fileURLToPath} from 'node:url'
const out=dirname(fileURLToPath(import.meta.url)),base='http://127.0.0.1:3487'
const browser=await chromium.launch({headless:true,channel:'chrome'}),runs=[]
mkdirSync(join(out,'targeted'),{recursive:true})
async function inspect(page){
 return page.evaluate(()=>{
 const b=el=>{if(!el)return null;const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom}}
 const button=[...document.querySelectorAll('button')].find(e=>e.textContent?.trim()==='Flugroute ändern')
 const status=[...document.querySelectorAll('[role=status]')].find(e=>e.textContent?.includes('Flugroute gespeichert'))
 return {activeTag:document.activeElement?.tagName,activeText:document.activeElement?.textContent?.trim().slice(0,80),trigger:b(button),status:status?.textContent||null,statusBox:b(status),scrollY,viewport:innerHeight,
  bodyText:document.body.innerText,invalid:[...document.querySelectorAll('input[aria-invalid=true]')].map(el=>({id:el.id,value:el.value,...b(el)})),
  alerts:[...document.querySelectorAll('[role=alert]')].map(el=>({text:el.textContent,...b(el)}))}
 })
}
for(const viewport of [{width:360,height:800},{width:390,height:844},{width:768,height:1024},{width:1440,height:900}]){
 const ctx=await browser.newContext({viewport,reducedMotion:'reduce'})
 const blocked=[];await ctx.route('**/*',r=>new URL(r.request().url()).origin!==base||r.request().method()!=='GET'||new URL(r.request().url()).pathname.startsWith('/api/')?(blocked.push(r.request().url()),r.abort()):r.continue())
 await ctx.addInitScript(t=>{if(!localStorage.getItem('jetnity:reise:v3'))localStorage.setItem('jetnity:reise:v3',JSON.stringify(t))},fixture())
 const page=await ctx.newPage();page.setDefaultTimeout(8000)
 const r={viewport,blocked};runs.push(r)
 try{
 await page.goto(base+'/reisen/'+fixture().id+'?ansicht=organisieren&bereich=fluege',{waitUntil:'networkidle'})
 await page.getByRole('button',{name:'Flugroute ergänzen',exact:true}).click()
 const form=page.getByRole('form',{name:'Flugroute für Manueller Flug'})
 const labels=['Abflugflughafen (IATA)','Ankunftsflughafen (IATA)','Abflugdatum','Abflugzeit (optional)','Ankunftsdatum','Ankunftszeit (optional)']
 const values=['NRT','LAX','2026-11-02','23:30','2026-11-01','12:00']
 for(let i=0;i<labels.length;i++)await form.getByLabel(labels[i],{exact:true}).fill(values[i])
 await form.getByRole('button',{name:'Speichern',exact:true}).click();await form.waitFor({state:'hidden'})
 await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))))
 r.newSingleSave=await inspect(page)
 await page.screenshot({path:join(out,'targeted',viewport.width+'-new-single-save.png')})
 await page.getByRole('button',{name:'Flugroute ändern',exact:true}).scrollIntoViewIfNeeded()
 r.readView=await inspect(page)
 await page.screenshot({path:join(out,'targeted',viewport.width+'-direct-read-view.png')})
 await page.getByRole('button',{name:'Flugroute ändern',exact:true}).click()
 for(let n=0;n<3;n++)await form.getByRole('button',{name:'Segment hinzufügen',exact:true}).click()
 const rows=[
 ['NRT','LAX','2026-11-02','23:30','2026-11-01','12:00'],
 ['LAX','JFK','2026-11-01','13:00','2026-11-01','21:00'],
 ['JFK','ZRH','2026-11-01','22:00','2026-11-02','11:00'],
 ['ZRH','FCO','2026-11-02','12:00','2026-11-02','14:00']]
 for(let n=0;n<4;n++)for(let i=0;i<labels.length;i++)await form.locator('fieldset').nth(n).getByLabel(labels[i],{exact:true}).fill(rows[n][i])
 await form.locator('fieldset').nth(0).getByLabel(labels[0],{exact:true}).fill('')
 await form.getByRole('button',{name:'Speichern',exact:true}).click();await form.getByRole('alert').waitFor()
 r.invalidFirstOfFour=await inspect(page)
 await page.screenshot({path:join(out,'targeted',viewport.width+'-four-segment-error.png')})
 await form.locator('fieldset').nth(0).getByLabel(labels[0],{exact:true}).fill('NRT')
 r.afterCorrectionInvalidCount=await form.locator('[aria-invalid=true]').count()
 await form.getByRole('button',{name:'Speichern',exact:true}).click();await form.waitFor({state:'hidden'})
 await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))))
 r.fourSave=await inspect(page)
 await page.screenshot({path:join(out,'targeted',viewport.width+'-four-save.png')})
 await page.getByText('Verbindung im Detail',{exact:true}).click()
 r.multiReadText=await page.getByRole('region',{name:'Deine Flüge'}).innerText()
 }catch(e){r.error=e.stack}
 writeFileSync(join(out,'targeted-findings.json'),JSON.stringify({checkedAt:new Date().toISOString(),runs},null,2)+'\n')
 await ctx.close()
}
await browser.close()
console.log(runs.map(r=>({viewport:r.viewport,newSave:r.newSingleSave&&{active:r.newSingleSave.activeTag,status:r.newSingleSave.status,trigger:r.newSingleSave.trigger},fourSave:r.fourSave&&{active:r.fourSave.activeTag,status:r.fourSave.status,trigger:r.fourSave.trigger},invalid:r.invalidFirstOfFour?.invalid.length,afterCorrection:r.afterCorrectionInvalidCount,error:r.error})))
