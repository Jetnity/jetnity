// Execute #903's existing browser/native audit entry points, relocating only evidence/loopback
// paths into this task. Production assertions and fixtures stay byte-for-byte otherwise.
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
const root='scripts/direct-trip-editing-1/.prior-replay',dir='docs/evidence/direct-trip-editing-1/regressions/integrated-903'
const sources=[],steps=[];mkdirSync(root,{recursive:true});mkdirSync(`${dir}/screens`,{recursive:true})
try{
 for(const file of ['browser.mjs','guest-pending.mjs','pending-form.mjs','account-browser.mjs','run.mjs']){
  const path=file==='run.mjs'?'scripts/db/trip-plan-integrated-operating-experience-1/run.mjs':`scripts/trip-plan-integrated-operating-experience-1/${file}`
  const source=readFileSync(path,'utf8');sources.push({path,sha256:createHash('sha256').update(source).digest('hex')})
  const relocated=source.replaceAll('docs/evidence/trip-plan-integrated-operating-experience-1',dir).replaceAll('54329','54339')
   .replace("'../../trip-plan-integrated-operating-experience-1/account-browser.mjs'","'./account-browser.mjs'")
  writeFileSync(`${root}/${file}`,relocated)
 }
 for(const file of ['browser.mjs','guest-pending.mjs','run.mjs']){
  const started=Date.now(),result=spawnSync(process.execPath,['--import','./scripts/server-only-test-register.mjs','--import','tsx',`${root}/${file}`],{env:process.env,stdio:'inherit'})
  steps.push({file,exitCode:result.status,durationMs:Date.now()-started});if(result.status!==0)process.exitCode=1
 }
}finally{rmSync(root,{recursive:true,force:true});writeFileSync(`${dir}/replay.json`,JSON.stringify({status:steps.length===3&&steps.every(s=>s.exitCode===0)?'PASS':'FAIL',sources,steps,relocation:'Evidence directory and loopback port only; same production assertions; no modifications to #903 files'},null,2)+'\n')}
