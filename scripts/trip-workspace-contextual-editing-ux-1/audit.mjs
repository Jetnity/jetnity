// Owned reproducible audit. Synthetic loopback only; never uses hosted credentials.
import {spawn,execFileSync} from 'node:child_process'
import {mkdirSync,createWriteStream,readFileSync,writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
const mode=process.argv[2]||'all'
if(!['all','checks'].includes(mode))throw Error('Use all or checks')
const dir='docs/evidence/trip-workspace-contextual-editing-ux-1',scripts='scripts/trip-workspace-contextual-editing-ux-1'
mkdirSync(`${dir}/logs`,{recursive:true})
const env=Object.fromEntries(['PATH','HOME','TMPDIR','TEMP','SystemRoot','TERM'].filter(k=>process.env[k]).map(k=>[k,process.env[k]]))
Object.assign(env,{NEXT_PUBLIC_SUPABASE_URL:'http://127.0.0.1:54339',NEXT_PUBLIC_SUPABASE_ANON_KEY:'synthetic-local-test',JETNITY_UI_AUDIT:'1',AUDIT_BASE:'http://127.0.0.1:3517',NEXT_TELEMETRY_DISABLED:'1'})
const paths=['components/trips/TripWorkspace.tsx','components/trips/TripWorkspaceEditSurface.tsx','components/trips/ReiseAenderung.tsx','components/trips/ReiseAenderungManuell.tsx','components/trips/ReiseAenderungAuswirkungen.tsx','lib/trips/workspace-edit-focus.ts']
const report={status:'RUNNING',mode,startedAt:new Date().toISOString(),codeHead:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sources:Object.fromEntries(paths.map(p=>[p,createHash('sha256').update(readFileSync(p)).digest('hex')])),steps:[],boundary:'Owned local production build; synthetic Guest and local Account fixtures; no hosted writes or paid/model/provider activation'}
const run=async(name,command,args,extra={})=>{
 const log=`${dir}/logs/${name}.log`,stream=createWriteStream(log),start=Date.now();console.log('RUN '+name)
 const p=spawn(command,args,{env:{...env,...extra},stdio:['ignore','pipe','pipe']});p.stdout.pipe(stream);p.stderr.pipe(stream)
 const exitCode=await new Promise(r=>{p.once('error',e=>{stream.write(String(e));r(127)});p.once('close',r)});await new Promise(r=>stream.end(r));report.steps.push({name,exitCode,durationMs:Date.now()-start,log});console.log((exitCode===0?'PASS ':'FAIL ')+name);if(exitCode!==0)throw Error(name+' failed')
}
let server,serverLog
try{
 if(mode==='all')await run('linux',process.execPath,[`${scripts}/replay.mjs`,'linux'])
 for(const name of ['typecheck','lint','check:dead','check:exports','check:deps','check:api-schutz','check:schema-bezug','check:operating-mode'])await run(name.replaceAll(':','-'),'npm',['run',name])
 await run('diff-check','git',['diff','--check'])
 if(mode==='all'){
  await run('build','npm',['run','build'])
  serverLog=createWriteStream(`${dir}/logs/server.log`);server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','3517'],{env,stdio:['ignore','pipe','pipe']});server.stdout.pipe(serverLog);server.stderr.pipe(serverLog)
  await new Promise((resolve,reject)=>{let output='';server.stdout.on('data',d=>{output+=d;if(output.includes('Ready'))resolve()});server.once('error',reject);server.once('exit',()=>reject(Error('Owned server did not start; do not use an unrelated server')))})
  for(const file of ['browser.mjs','edges.mjs'])await run(file.replace('.mjs',''),process.execPath,[`${scripts}/${file}`])
  await run('geometry',process.execPath,[`${scripts}/geometry.mjs`,'after'])
  for(const replay of ['guest','account','903'])await run(replay,process.execPath,[`${scripts}/replay.mjs`,replay])
  await run('workspace-regressions',process.execPath,[`${scripts}/regressions.mjs`])
 }
 report.status='PASS'
}catch(e){report.status='FAIL';report.failure=e.message;process.exitCode=1}
finally{
 if(server&&server.exitCode===null){server.kill('SIGTERM');await new Promise(r=>server.once('close',r))}if(serverLog)await new Promise(r=>serverLog.end(r))
 report.finishedAt=new Date().toISOString();writeFileSync(`${dir}/${mode}-audit.json`,JSON.stringify(report,null,2)+'\n');console.log(report.status)
}
