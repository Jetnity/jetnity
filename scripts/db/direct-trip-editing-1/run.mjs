// Owned loopback GoTrue + PostgREST + PostgreSQL. No inherited DSN, no hosted data.
import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { randomBytes, createHmac, createHash } from 'node:crypto'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { createServer, request } from 'node:http'
import { createClient } from '@supabase/supabase-js'
import { createRequire } from 'node:module'
const require=createRequire(import.meta.url)
const { accountPlanSchreiben }=require('../../../lib/trips/trip-plan-integrated/account-write.ts')

const output='docs/evidence/direct-trip-editing-1/account-persistence.json'
const run=`jetnity-direct-${randomBytes(5).toString('hex')}`, created=[]
const secret=randomBytes(48).toString('hex'), password=randomBytes(24).toString('hex')
const docker=(args,input)=>execFileSync('docker',args,{input,encoding:'utf8',stdio:['pipe','pipe','pipe'],maxBuffer:8*1024*1024})
const psql=sql=>docker(['exec','-i',`${run}-db`,'psql','-U','postgres','-v','ON_ERROR_STOP=1','-At'],sql)
const results=[],sources=[],environment={node:process.version,authImage:'public.ecr.aws/supabase/gotrue:v2.196.0',restImage:'public.ecr.aws/supabase/postgrest:v16.2'}
let gateway
const traffic={rpc:0,tripReads:0,catalog:0,quota:0},faults={reads:false,afterWrite:false,loseAck:false};
const control=values=>Object.assign(faults,values)
const check=async(name,fn)=>{const value=await fn();results.push({name,status:'PASS'});return value}
const jwt=role=>{const a=Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url'),b=Buffer.from(JSON.stringify({role,iss:'supabase',iat:Math.floor(Date.now()/1000),exp:Math.floor(Date.now()/1000)+3600})).toString('base64url');return `${a}.${b}.${createHmac('sha256',secret).update(`${a}.${b}`).digest('base64url')}`}
const wait=async(fn)=>{for(let i=0;i<60;i++){try{if(await fn())return}catch{}await new Promise(r=>setTimeout(r,500))}throw Error('Owned service startup failed')}
const start=(name,args)=>{docker(['run','-d','--name',name,'--label',`jetnity.direct.owner=${run}`,...args]);created.push(name)}
let status='FAIL',failure,stage='database'
try {
  // Never pull images, reuse installed test runtimes only.
  assert.match(docker(['context','inspect','--format','{{.Endpoints.docker.Host}}']).trim(),/^unix:\/\//,'Local Docker only')
  for(const image of ['jetnity-r2-validation:local','public.ecr.aws/supabase/gotrue:v2.196.0','public.ecr.aws/supabase/postgrest:v16.2'])docker(['image','inspect',image])
  docker(['network','create','--label',`jetnity.direct.owner=${run}`,run])
  start(`${run}-db`,['--network',run,'--network-alias','db','--entrypoint','sh','jetnity-r2-validation:local','-c',"initdb -D /tmp/plan-db -A trust >/tmp/init.log && echo 'host all all 0.0.0.0/0 trust' >> /tmp/plan-db/pg_hba.conf && exec postgres -D /tmp/plan-db -c listen_addresses='*'"])
  await wait(()=>{psql('select 1');return true})
  environment.postgres=psql('select version()').trim()
  psql(`create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
    create role authenticator login noinherit; grant anon,authenticated,service_role to authenticator;
    create role supabase_auth_admin login superuser; create schema auth authorization supabase_auth_admin;
    alter role supabase_auth_admin set search_path=auth;`)
  start(`${run}-auth`,['--network',run,'-p','127.0.0.1::9999','-e','GOTRUE_API_HOST=0.0.0.0','-e','GOTRUE_API_PORT=9999',
    '-e','API_EXTERNAL_URL=http://127.0.0.1:54339/auth/v1','-e','GOTRUE_SITE_URL=http://127.0.0.1:3517',
    '-e','GOTRUE_DB_DRIVER=postgres','-e','GOTRUE_DB_DATABASE_URL=postgres://supabase_auth_admin@db:5432/postgres?sslmode=disable',
    '-e',`GOTRUE_JWT_SECRET=${secret}`,'-e','GOTRUE_JWT_EXP=3600','-e','GOTRUE_JWT_AUD=authenticated','-e','GOTRUE_JWT_DEFAULT_GROUP_NAME=authenticated',
    '-e','GOTRUE_JWT_ADMIN_ROLES=service_role','-e','GOTRUE_EXTERNAL_EMAIL_ENABLED=true','-e','GOTRUE_MAILER_AUTOCONFIRM=true',
    'public.ecr.aws/supabase/gotrue:v2.196.0'])
  const port=name=>Number(docker(['port',name]).trim().split(':').at(-1))
  stage='auth'; console.log('Database ready; starting auth')
  const authPort=port(`${run}-auth`)
  await wait(async()=> (await fetch(`http://127.0.0.1:${authPort}/health`)).ok)
  psql(`grant usage on schema auth to anon,authenticated; grant execute on function auth.uid() to anon,authenticated;`)
  psql('create schema extensions; create extension pg_trgm with schema extensions;')
  for(const name of ['20260817120000_reiseschema.sql','20260820010000_reise_stage_revision.sql','20260820060000_reise_graph_revision.sql','20260820080000_reise_tage_eindeutig_aufgeschoben.sql','20260820120000_places_referenz.sql','20260820130000_reise_aendern_places.sql','20260821100000_trip_items_booking_status.sql','20260822010000_trip_readiness_items.sql','20260822020000_trip_travellers.sql','20260822160000_traveller_context_intelligence.sql']) {
    const path=`supabase/migrations/${name}`,sql=readFileSync(path,'utf8');psql(sql);sources.push({path,sha256:createHash('sha256').update(sql).digest('hex')})
  }
  start(`${run}-rest`,['--network',run,'-p','127.0.0.1::3000','-e','PGRST_DB_URI=postgres://authenticator@db:5432/postgres','-e','PGRST_DB_SCHEMAS=public',
    '-e','PGRST_DB_ANON_ROLE=anon','-e',`PGRST_JWT_SECRET=${secret}`,'public.ecr.aws/supabase/postgrest:v16.2'])
  stage='rest'; console.log('Auth ready; starting REST')
  const restPort=port(`${run}-rest`)
  await wait(async()=> (await fetch(`http://127.0.0.1:${restPort}/`)).ok)
  gateway=createServer((req,res)=>{
    const auth=req.url.startsWith('/auth/v1/'),rest=req.url.startsWith('/rest/v1/')
    if(!auth&&!rest){res.writeHead(404);res.end();return}
    if(rest&&req.url.includes('/rpc/reise_aendern'))traffic.rpc++
    if(rest&&req.url.includes('/rpc/')&&!req.url.includes('reise_aendern'))traffic.quota++
    if(rest&&/places|places_suchen/.test(req.url)){traffic.catalog++;res.writeHead(503);res.end();return}
    if(rest&&req.method==='GET'&&req.url.startsWith('/rest/v1/trips?')){traffic.tripReads++;if(faults.reads){res.writeHead(503);res.end();return}}
    const isWrite=rest&&req.url.includes('/rpc/reise_aendern')
    const proxy=request({host:'127.0.0.1',port:auth?authPort:restPort,path:req.url.replace(auth?'/auth/v1':'/rest/v1',''),method:req.method,headers:req.headers},up=>{if(isWrite&&faults.afterWrite)faults.reads=true;if(isWrite&&faults.loseAck){up.resume();up.on('end',()=>{res.writeHead(502);res.end()});return}res.writeHead(up.statusCode,up.headers);up.pipe(res)})
    proxy.on('error',()=>{res.writeHead(502);res.end()});req.pipe(proxy)
  })
  await new Promise((resolve,reject)=>{gateway.once('error',reject);gateway.listen(54339,'127.0.0.1',resolve)})
  const url=`http://127.0.0.1:${gateway.address().port}`,anon=jwt('anon')
  const clients=[]
  for(const actor of ['owner','outsider']) {
    const db=createClient(url,anon,{auth:{persistSession:false,autoRefreshToken:false}})
    const {data,error}=await db.auth.signUp({email:`${actor}@direct-fixture.invalid`,password});assert.ifError(error);assert(data.session)
    const verified=await db.auth.getUser();assert.ifError(verified.error);assert.equal(verified.data.user.id,data.user.id)
    clients.push({db,id:data.user.id})
  }
  results.push({name:'Real GoTrue signup, password/session issuance and server getUser for two synthetic owners',status:'PASS'})
  const {db,id:owner}=clients[0],outside=clients[1]
  stage='manual authenticated browser'
  const { accountBrowser }=await import('../../direct-trip-editing-1/account-browser.mjs')
  const outcome=await check('Production manual Account browser with real Auth/RLS/RPC and negative/recovery controls',()=>accountBrowser({url,anon,db,outside:outside.db,psql,accountPlanSchreiben,owner,control,traffic}))
  status=outcome.status
} catch(error) {for(const name of created){try { const log=spawnSync('docker',['logs','--tail','12',name],{encoding:'utf8'}); console.error((log.stdout+log.stderr).replaceAll(secret,'[redacted]').replaceAll(password,'[redacted]')) } catch {} } failure=stage+': '+String(error.message).replaceAll(secret,'[redacted]').replaceAll(password,'[redacted]');console.error(failure);process.exitCode=1}
finally {
  if(gateway?.listening)await new Promise(r=>gateway.close(r))
  for(const name of created.reverse())try{docker(['rm','-fv',name])}catch{}
  try{docker(['network','rm',run])}catch{}
  mkdirSync('docs/evidence/direct-trip-editing-1',{recursive:true})
  writeFileSync(output,JSON.stringify({status,boundary:'Real GoTrue -> authenticated PostgREST/RLS -> production accountPlanSchreiben -> independent authenticated reload. Browser server-action graph refresh is a separate boundary.',environment,results,sources,traffic,failure,cleanup:'Only run-owned containers/network removed',hostedTargets:false},null,2)+'\n')
  console.log(`${status}: ${results.length} authenticated persistence cases; ${output}`)
}
