#!/usr/bin/env node
// One direct command; no package/dependency/config changes and no hosted credentials.
import { spawn, execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { createWriteStream, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
const dir='docs/evidence/trip-plan-integrated-operating-experience-1',logs=join(dir,'logs')
mkdirSync(logs,{recursive:true})
const env=Object.fromEntries(['PATH','HOME','TMPDIR','TEMP','SystemRoot','TERM'].filter(k=>process.env[k]).map(k=>[k,process.env[k]]))
Object.assign(env,{NEXT_PUBLIC_SUPABASE_URL:'http://127.0.0.1:54329',NEXT_PUBLIC_SUPABASE_ANON_KEY:'synthetic-local-test',JETNITY_UI_AUDIT:'1',AUDIT_BASE:'http://127.0.0.1:3507',NEXT_TELEMETRY_DISABLED:'1'})
const files=execFileSync('git',['ls-files','--cached','--others','--exclude-standard','lib/trips','lib/readiness','lib/route','components/trips','types/trips.ts','scripts/trip-plan-integrated-operating-experience-1','scripts/db/trip-plan-integrated-operating-experience-1','scripts/trip-plan-integrated-operating-experience-1-audit.mjs','scripts/trip-timeline-core-1-audit.mjs','scripts/trip-timeline-temporal-review-1-audit.mjs','scripts/trip-workspace-contextual-navigation-1-audit.mjs','scripts/trip-plan-premium-experience-4-audit.mjs'],{encoding:'utf8'}).trim().split('\n').filter(Boolean).sort()
const sources=Object.fromEntries(files.map(path=>[path,createHash('sha256').update(readFileSync(path)).digest('hex')]))
const report={startedAt:new Date().toISOString(),codeHead:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sources,steps:[],status:'RUNNING'}
const persist=()=>{
  writeFileSync(join(dir,'integrated-audit.json'),JSON.stringify(report,null,2)+'\n')
  writeFileSync(join(dir,'integrated-audit.txt'),`${report.status}\nCode head at start: ${report.codeHead}\n${report.steps.map(s=>`${s.status} ${s.name} (${s.exitCode}) -> ${s.log}`).join('\n')}\nBrowser/Account/Device/Live activation boundaries are recorded separately.\n`)
}
const run=async(name,command,args,extraEnv={})=>{
  const log=join(logs,`${name}.log`),stream=createWriteStream(log),started=Date.now()
  console.log(`RUN ${name}`)
  const child=spawn(command,args,{env:{...env,...extraEnv},stdio:['ignore','pipe','pipe']});child.stdout.pipe(stream);child.stderr.pipe(stream)
  const exitCode=await new Promise(resolve=>{child.once('error',e=>{stream.write(String(e));resolve(127)});child.once('close',resolve)})
  await new Promise(resolve=>stream.end(resolve))
  report.steps.push({name,status:exitCode===0?'PASS':'FAIL',exitCode,durationMs:Date.now()-started,log});persist();console.log(`${exitCode===0?'PASS':'FAIL'} ${name}`)
  return exitCode===0
}
let server
try {
  if(process.platform==='darwin')await run('npm-test-linux',process.execPath,['scripts/trip-plan-integrated-operating-experience-1/linux-tests.mjs'])
  else await run('npm-test','npm',['test'])
  for(const name of ['typecheck','lint','build','check:dead','check:exports','check:deps','check:api-schutz','check:schema-bezug','check:operating-mode'])await run(name.replaceAll(':','-'),'npm',['run',name])
  await run('diff-check','git',['diff','--check'])
  if(report.steps.find(s=>s.name==='build')?.status==='PASS'){
    const serverLog=createWriteStream(join(logs,'production-server.log'))
    server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','3507'],{env,stdio:['ignore','pipe','pipe']})
    server.stdout.pipe(serverLog);server.stderr.pipe(serverLog)
    let ready=false
    for(let i=0;i<40;i++){if(server.exitCode!==null)break;try{ready=(await fetch(`${env.AUDIT_BASE}/reisen/trip-readiness`)).ok}catch{}if(ready)break;await new Promise(r=>setTimeout(r,500))}
    if(!ready)throw Error('Owned production server did not start; do not use an unrelated existing server')
    await run('guest-browser',process.execPath,['--import','tsx','scripts/trip-plan-integrated-operating-experience-1/browser.mjs'])
    await run('guest-pending-editor',process.execPath,['--import','tsx','scripts/trip-plan-integrated-operating-experience-1/guest-pending.mjs'])
    for(const audit of ['trip-timeline-core-1','trip-timeline-temporal-review-1','trip-workspace-contextual-navigation-1','trip-plan-premium-experience-4'])
      await run(audit,process.execPath,['--import','tsx',`scripts/${audit}-audit.mjs`],{AUDIT_EVIDENCE_DIR:join(dir,'regressions',audit),AUDIT_BROWSER:'1',CHROME_PATH:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',AUDIT_SERVER_MODE:'production'})
    await run('account-persistence',process.execPath,['--import','./scripts/server-only-test-register.mjs','--import','tsx','scripts/db/trip-plan-integrated-operating-experience-1/run.mjs'])
  }
  report.status=report.steps.every(s=>s.status==='PASS')?'PASS':'FAIL'
} catch(error){report.status='FAIL';report.failure=String(error.message)}
finally {
  if(server&&server.exitCode===null){server.kill('SIGTERM');await new Promise(r=>server.once('close',r))}
  report.finishedAt=new Date().toISOString();persist();console.log(`${report.status}: ${dir}/integrated-audit.txt`);if(report.status!=='PASS')process.exitCode=1
}
