import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import assert from 'node:assert/strict'
const mode=process.argv[2]
assert(['guest','account','903','linux'].includes(mode))
const root=`scripts/trip-workspace-contextual-editing-ux-1/.replay-${mode}`,dir=`docs/evidence/trip-workspace-contextual-editing-ux-1/regressions/${mode}`
mkdirSync(root,{recursive:true});mkdirSync(`${dir}/screens`,{recursive:true})
const sources=[],steps=[]
const copy=(path,name,adapt=x=>x)=>{
 const text=readFileSync(path,'utf8');sources.push({path,sha256:createHash('sha256').update(text).digest('hex')})
 writeFileSync(`${root}/${name}`,adapt(text))
}
const run=file=>{const result=spawnSync(process.execPath,['--import','./scripts/server-only-test-register.mjs','--import','tsx',`${root}/${file}`],{env:{...process.env,AUDIT_BASE:'http://127.0.0.1:3517'},stdio:'inherit'});steps.push({file,exitCode:result.status});if(result.status!==0)process.exitCode=1}
const adapt905=text=>"import { editLabel as label } from '../navigation.mjs'\n"+text.replaceAll('docs/evidence/direct-trip-editing-1',dir).replaceAll('page.getByLabel(', 'label(page,').replace("console.log('RUN '+name);await fn();results.push({name,status:'PASS'})","console.log('RUN '+name);const started=Date.now();await fn();results.push({name,status:'PASS',durationMs:Date.now()-started})").replaceAll("require('../../lib/", "require('../../../lib/")
try{
 if(mode==='guest') {
  copy('scripts/direct-trip-editing-1/browser.mjs','browser.mjs',text=>{
   const marker='assert.equal(await protectedGroup.locator(\'li\').count(),20)'
   assert(text.includes(marker),'frozen large-preview assertion must exist')
   return adapt905(text).replace(marker,marker+`;const protectedSeen=await protectedGroup.locator('li').allTextContents(),docY=await page.evaluate(()=>scrollY)
   for(let index=1;index<13;index++){await protectedGroup.getByRole('button',{name:'Weitere Einträge'}).click();await page.waitForFunction(({index})=>[...document.querySelectorAll('details[open] span')].some(s=>s.textContent.startsWith(String(index*20+1)+'–')),{index});protectedSeen.push(...await protectedGroup.locator('li').allTextContents());assert((await protectedGroup.locator('li').count())<=20);assert.equal(await page.evaluate(()=>scrollY),docY)}
   assert.equal(new Set(protectedSeen).size,250);assert(await protectedGroup.getByRole('button',{name:'Weitere Einträge'}).isDisabled())`)
  });run('browser.mjs')
 }
 if(mode==='account') {
  copy('scripts/direct-trip-editing-1/fixture.ts','fixture.ts')
  copy('scripts/direct-trip-editing-1/account-browser.mjs','account-browser.mjs',adapt905)
  copy('scripts/db/direct-trip-editing-1/run.mjs','run.mjs',s=>s.replaceAll('docs/evidence/direct-trip-editing-1',dir).replace("'../../direct-trip-editing-1/account-browser.mjs'","'./account-browser.mjs'"))
  run('run.mjs')
 }
 if(mode==='903') {
  for(const file of ['browser.mjs','guest-pending.mjs','pending-form.mjs','account-browser.mjs','run.mjs']){
   copy(file==='run.mjs'?`scripts/db/trip-plan-integrated-operating-experience-1/${file}`:`scripts/trip-plan-integrated-operating-experience-1/${file}`,file,
    s=>s.replaceAll('docs/evidence/trip-plan-integrated-operating-experience-1',dir).replaceAll('54329','54339').replace("'../../trip-plan-integrated-operating-experience-1/account-browser.mjs'","'./account-browser.mjs'"))
  }
  for(const file of ['browser.mjs','guest-pending.mjs','run.mjs'])run(file)
 }
 if(mode==='linux') {
  copy('scripts/direct-trip-editing-1/linux-tests.mjs','linux.mjs',s=>s.replaceAll('docs/evidence/direct-trip-editing-1/logs',dir).replaceAll('feat/direct-trip-editing-1','feat/trip-workspace-contextual-editing-ux-1').replace('&& npm test >','&& env -u PG_MAJOR -u PG_VERSION -u PGDATA npm test >'))
  run('linux.mjs')
 }
} finally {
 rmSync(root,{recursive:true,force:true})
 writeFileSync(`${dir}/replay.json`,JSON.stringify({status:steps.length&&steps.every(s=>s.exitCode===0)?'PASS':'FAIL',mode,sources,steps,adaptations:'Task-owned evidence, loopback endpoints, import relocation, current branch and clean PG environment for Linux; timing and all 250 protected rows additionally asserted; #905 manipulation uses real progressive group buttons. Original graph/security assertions unchanged.'},null,2)+'\n')
}
