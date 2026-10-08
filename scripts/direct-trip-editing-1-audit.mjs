#!/usr/bin/env node
// One direct command; no package/dependency/config changes and no hosted credentials.
import { spawn, execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { createWriteStream, mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
const dir='docs/evidence/direct-trip-editing-1',logs=join(dir,'logs')
mkdirSync(logs,{recursive:true})
const env=Object.fromEntries(['PATH','HOME','TMPDIR','TEMP','SystemRoot','TERM'].filter(k=>process.env[k]).map(k=>[k,process.env[k]]))
Object.assign(env,{NEXT_PUBLIC_SUPABASE_URL:'http://127.0.0.1:54339',NEXT_PUBLIC_SUPABASE_ANON_KEY:'synthetic-local-test',JETNITY_UI_AUDIT:'1',AUDIT_BASE:'http://127.0.0.1:3517',NEXT_TELEMETRY_DISABLED:'1'})
const files=execFileSync('git',['ls-files','--cached','--others','--exclude-standard','lib/reiseaenderung','lib/trips','lib/readiness','lib/route','components/trips','types/trips.ts','scripts/direct-trip-editing-1','scripts/db/direct-trip-editing-1','scripts/direct-trip-editing-1-audit.mjs','scripts/trip-timeline-core-1-audit.mjs','scripts/trip-timeline-temporal-review-1-audit.mjs','scripts/trip-workspace-contextual-navigation-1-audit.mjs','scripts/trip-plan-premium-experience-4-audit.mjs'],{encoding:'utf8'}).trim().split('\n').filter(Boolean).sort()
const sources=Object.fromEntries(files.map(path=>[path,createHash('sha256').update(readFileSync(path)).digest('hex')]))
const report={environment:{node:process.version,platform:process.platform,arch:process.arch,model:'disabled',credentials:'synthetic loopback only'},startedAt:new Date().toISOString(),codeHead:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sources,steps:[],status:'RUNNING'}
// Published logs are bounded and sanitized; totals come from the complete command output.
const boundedLog=path=>{
  if(!existsSync(path))return null
  const raw=readFileSync(path,'utf8'),totals=Object.fromEntries([...raw.matchAll(/^# (tests|suites|pass|fail|cancelled|skipped|todo|duration_ms) (.+)$/gm)].map(m=>[m[1],Number(m[2])]))
  const lines=raw.replaceAll(process.cwd(),'<worktree>').replace(/\/Users\/[^\s/:]+/g,'<local-user>').replace(/\x1b\[[0-9;]*m/g,'').replace(/postgres(?:ql)?:\/\/[^\s"']+/g,'[redacted-local-dsn]').split('\n')
  const bounded=lines.length>240?[...lines.slice(0,80),`[bounded excerpt: ${lines.length-240} middle lines omitted; full output totals captured]`,...lines.slice(-160)]:lines
  writeFileSync(path,bounded.map(line=>line.trimEnd()).join('\n').trimEnd()+'\n');return Object.keys(totals).length?totals:null
}
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
  const totals=boundedLog(name==='npm-test-linux'?join(logs,'npm-test-full.log'):log);if(name==='npm-test-linux')boundedLog(log)
  report.steps.push({name,totals,status:exitCode===0?'PASS':exitCode===2?'BLOCKED':'FAIL',exitCode,durationMs:Date.now()-started,log});persist();console.log(`${exitCode===0?'PASS':exitCode===2?'BLOCKED':'FAIL'} ${name}`)
  return exitCode===0
}
let server
try {
  if(process.platform==='darwin')await run('npm-test-linux',process.execPath,['scripts/direct-trip-editing-1/linux-tests.mjs'])
  else await run('npm-test','npm',['test'])
  for(const name of ['typecheck','lint','build','check:dead','check:exports','check:deps','check:api-schutz','check:schema-bezug','check:operating-mode'])await run(name.replaceAll(':','-'),'npm',['run',name])
  await run('baseline-counterexamples',process.execPath,['--import','tsx','scripts/direct-trip-editing-1/baseline.mjs'])
  await run('diff-check','git',['diff','--check'])
  if(report.steps.find(s=>s.name==='build')?.status==='PASS'){
    const serverLog=createWriteStream(join(logs,'production-server.log'))
    server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','3517'],{env,stdio:['ignore','pipe','pipe']})
    server.stdout.pipe(serverLog);server.stderr.pipe(serverLog)
    let ready=false
    for(let i=0;i<40;i++){if(server.exitCode!==null)break;try{ready=(await fetch(`${env.AUDIT_BASE}/reisen/trip-readiness`)).ok}catch{}if(ready)break;await new Promise(r=>setTimeout(r,500))}
    if(!ready)throw Error('Owned production server did not start; do not use an unrelated existing server')
    await run('guest-browser',process.execPath,['--import','tsx','scripts/direct-trip-editing-1/browser.mjs'])
    await run('integrated-903-regression',process.execPath,['scripts/direct-trip-editing-1/prior-regression.mjs'])
    for(const audit of ['trip-timeline-core-1','trip-timeline-temporal-review-1','trip-workspace-contextual-navigation-1','trip-plan-premium-experience-4'])
      await run(audit,process.execPath,['--import','tsx',`scripts/${audit}-audit.mjs`],{AUDIT_EVIDENCE_DIR:join(dir,'regressions',audit),AUDIT_BROWSER:'1',CHROME_PATH:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',AUDIT_SERVER_MODE:'production'})
    await run('account-persistence',process.execPath,['--import','./scripts/server-only-test-register.mjs','--import','tsx','scripts/db/direct-trip-editing-1/run.mjs'])
  }
  report.status=report.steps.some(s=>s.status==='FAIL')?'FAIL':report.steps.some(s=>s.status==='BLOCKED')?'BLOCKED':'PASS'
} catch(error){report.status='FAIL';report.failure=String(error.message)}
finally {
  if(server&&server.exitCode===null){server.kill('SIGTERM');await new Promise(r=>server.once('close',r))}
  report.finishedAt=new Date().toISOString();persist();console.log(`${report.status}: ${dir}/integrated-audit.txt`);if(report.status!=='PASS')process.exitCode=report.status==='BLOCKED'?2:1
}
