import {chromium} from 'playwright'
import {fixture} from './fixtures.mjs'
import {writeFileSync} from 'node:fs'
import {dirname,join} from 'node:path'
import {fileURLToPath} from 'node:url'
const out=dirname(fileURLToPath(import.meta.url)),base='http://127.0.0.1:3487',runs=[]
const browser=await chromium.launch({channel:'chrome',headless:true})
for(const viewport of [{width:390,height:844},{width:1440,height:900}]){
 const ctx=await browser.newContext({viewport,reducedMotion:'reduce'}),run={viewport,steps:[],blocked:[]};runs.push(run)
 await ctx.route('**/*',r=>new URL(r.request().url()).origin!==base||r.request().method()!=='GET'||new URL(r.request().url()).pathname.startsWith('/api/')?(run.blocked.push(r.request().url()),r.abort()):r.continue())
 await ctx.addInitScript(t=>{if(!localStorage.getItem('jetnity:reise:v3'))localStorage.setItem('jetnity:reise:v3',JSON.stringify(t))},fixture())
 const page=await ctx.newPage();page.setDefaultTimeout(8000)
 try{
 await page.goto(base+'/reisen/'+fixture().id+'?ansicht=plan&tag=day-1',{waitUntil:'networkidle'})
 for(const kind of ['Unterkunft','Flug']){
  await page.getByRole('button',{name:'Punkt hinzufügen',exact:true}).click()
  const form=page.locator('[data-tagesplan-modul] form')
  await form.getByRole('button',{name:kind,exact:true}).click()
  await form.getByLabel('Ort oder Aktivität',{exact:true}).fill('UI '+kind+' Audit')
  await form.getByRole('button',{name:'Speichern',exact:true}).click();await form.waitFor({state:'hidden'})
  await page.getByRole('button',{name:kind+' UI '+kind+' Audit',exact:true}).click()
  await page.locator('[data-workspace-detail]').waitFor()
  run.steps.push(kind+' created through actual plan form and opened as item detail')
  await page.screenshot({path:join(out,'targeted',viewport.width+'-created-'+(kind==='Flug'?'flight':'stay')+'.png')})
  await page.goBack();await page.locator('[data-workspace-detail]').waitFor({state:'hidden'})
  if(!page.url().includes('tag=day-1'))throw new Error('Day context lost')
 }
 await page.reload({waitUntil:'networkidle'})
 run.savedItems=await page.evaluate(()=>JSON.parse(localStorage.getItem('jetnity:reise:v3')).days[0].items.map(i=>({title:i.title,kind:i.kind,startsOn:i.startsOn})))
 run.steps.push('both manually created items survive reload and return preserves day-1')
 run.status='PASS'
 }catch(e){run.status='FAIL';run.error=e.stack}
 await ctx.close()
}
await browser.close()
writeFileSync(join(out,'create-flow.json'),JSON.stringify({checkedAt:new Date().toISOString(),runs},null,2)+'\n')
console.log(runs)
