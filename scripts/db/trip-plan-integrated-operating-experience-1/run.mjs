// Owned loopback GoTrue + PostgREST + PostgreSQL. No inherited DSN, no hosted data.
import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { randomBytes, randomUUID, createHmac, createHash } from 'node:crypto'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { createServer, request } from 'node:http'
import { createClient } from '@supabase/supabase-js'
import { createRequire } from 'node:module'
const require=createRequire(import.meta.url)
const { accountPlanSchreiben }=require('../../../lib/trips/trip-plan-integrated/account-write.ts')

const output='docs/evidence/trip-plan-integrated-operating-experience-1/account-persistence.json'
const run=`jetnity-plan-${randomBytes(5).toString('hex')}`, created=[]
const secret=randomBytes(48).toString('hex'), password=randomBytes(24).toString('hex')
const docker=(args,input)=>execFileSync('docker',args,{input,encoding:'utf8',stdio:['pipe','pipe','pipe'],maxBuffer:8*1024*1024})
const psql=sql=>docker(['exec','-i',`${run}-db`,'psql','-U','postgres','-v','ON_ERROR_STOP=1','-At'],sql)
const results=[],sources=[]
let gateway
const check=async(name,fn)=>{await fn();results.push({name,status:'PASS'})}
const jwt=role=>{const a=Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url'),b=Buffer.from(JSON.stringify({role,iss:'supabase',iat:Math.floor(Date.now()/1000),exp:Math.floor(Date.now()/1000)+3600})).toString('base64url');return `${a}.${b}.${createHmac('sha256',secret).update(`${a}.${b}`).digest('base64url')}`}
const wait=async(fn)=>{for(let i=0;i<60;i++){try{if(await fn())return}catch{}await new Promise(r=>setTimeout(r,500))}throw Error('Owned service startup failed')}
const start=(name,args)=>{docker(['run','-d','--name',name,'--label',`jetnity.plan.owner=${run}`,...args]);created.push(name)}
let status='FAIL',failure,stage='database'
try {
  // Never pull images, reuse installed test runtimes only.
  assert.match(docker(['context','inspect','--format','{{.Endpoints.docker.Host}}']).trim(),/^unix:\/\//,'Local Docker only')
  for(const image of ['jetnity-r2-validation:local','public.ecr.aws/supabase/gotrue:v2.196.0','public.ecr.aws/supabase/postgrest:v16.2'])docker(['image','inspect',image])
  docker(['network','create','--label',`jetnity.plan.owner=${run}`,run])
  start(`${run}-db`,['--network',run,'--network-alias','db','--entrypoint','sh','jetnity-r2-validation:local','-c',"initdb -D /tmp/plan-db -A trust >/tmp/init.log && echo 'host all all 0.0.0.0/0 trust' >> /tmp/plan-db/pg_hba.conf && exec postgres -D /tmp/plan-db -c listen_addresses='*'"])
  await wait(()=>{psql('select 1');return true})
  psql(`create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
    create role authenticator login noinherit; grant anon,authenticated,service_role to authenticator;
    create role supabase_auth_admin login superuser; create schema auth authorization supabase_auth_admin;
    alter role supabase_auth_admin set search_path=auth;`)
  start(`${run}-auth`,['--network',run,'-p','127.0.0.1::9999','-e','GOTRUE_API_HOST=0.0.0.0','-e','GOTRUE_API_PORT=9999',
    '-e','API_EXTERNAL_URL=http://127.0.0.1:54329/auth/v1','-e','GOTRUE_SITE_URL=http://127.0.0.1:3497',
    '-e','GOTRUE_DB_DRIVER=postgres','-e','GOTRUE_DB_DATABASE_URL=postgres://supabase_auth_admin@db:5432/postgres?sslmode=disable',
    '-e',`GOTRUE_JWT_SECRET=${secret}`,'-e','GOTRUE_JWT_EXP=3600','-e','GOTRUE_JWT_AUD=authenticated','-e','GOTRUE_JWT_DEFAULT_GROUP_NAME=authenticated',
    '-e','GOTRUE_JWT_ADMIN_ROLES=service_role','-e','GOTRUE_EXTERNAL_EMAIL_ENABLED=true','-e','GOTRUE_MAILER_AUTOCONFIRM=true',
    'public.ecr.aws/supabase/gotrue:v2.196.0'])
  const port=name=>Number(docker(['port',name]).trim().split(':').at(-1))
  stage='auth'; console.log('Database ready; starting auth')
  const authPort=port(`${run}-auth`)
  await wait(async()=> (await fetch(`http://127.0.0.1:${authPort}/health`)).ok)
  psql(`grant usage on schema auth to anon,authenticated; grant execute on function auth.uid() to anon,authenticated;`)
  for(const name of ['20260817120000_reiseschema.sql','20260820010000_reise_stage_revision.sql','20260820060000_reise_graph_revision.sql','20260821100000_trip_items_booking_status.sql','20260822010000_trip_readiness_items.sql','20260822020000_trip_travellers.sql','20260822160000_traveller_context_intelligence.sql']) {
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
    const proxy=request({host:'127.0.0.1',port:auth?authPort:restPort,path:req.url.replace(auth?'/auth/v1':'/rest/v1',''),method:req.method,headers:req.headers},up=>{res.writeHead(up.statusCode,up.headers);up.pipe(res)})
    proxy.on('error',()=>{res.writeHead(502);res.end()});req.pipe(proxy)
  })
  await new Promise((resolve,reject)=>{gateway.once('error',reject);gateway.listen(54329,'127.0.0.1',resolve)})
  const url=`http://127.0.0.1:${gateway.address().port}`,anon=jwt('anon')
  const clients=[]
  for(const actor of ['owner','outsider']) {
    const db=createClient(url,anon,{auth:{persistSession:false,autoRefreshToken:false}})
    const {data,error}=await db.auth.signUp({email:`${actor}@plan-fixture.invalid`,password});assert.ifError(error);assert(data.session)
    const verified=await db.auth.getUser();assert.ifError(verified.error);assert.equal(verified.data.user.id,data.user.id)
    clients.push({db,id:data.user.id})
  }
  results.push({name:'Real GoTrue signup, password/session issuance and server getUser for two synthetic owners',status:'PASS'})
  const {db,id:owner}=clients[0],outside=clients[1]
  const tripId=randomUUID(),dayId=randomUUID(),stageId=randomUUID()
  for(const [table,row] of [['trips',{id:tripId,title:'Synthetic integrated account'}],['trip_stages',{id:stageId,trip_id:tripId,name:'Synthetic place'}],['trip_days',{id:dayId,trip_id:tripId,stage_id:stageId,day_index:1,day_date:'2026-10-07'}]])assert.ifError((await db.from(table).insert(row)).error)
  assert.ifError((await db.from('trip_days').insert({trip_id:tripId,stage_id:stageId,day_index:2,day_date:'2026-10-08'})).error)
  const values={tripId,dayId,clientRef:randomUUID(),kind:'activity',title:'Synthetic visit',note:null,startsOn:'2026-10-07',startsAt:'10:00',endsOn:'2026-10-07',endsAt:'11:00'}
  let saved
  await check('Actual account writer creates and reads authoritative row with version',async()=>{saved=await accountPlanSchreiben(db,owner,'anlegen',values);assert(saved.rowVersion);assert.equal(saved.endsAt,'11:00')})
  await check('Stable request retry preserves one identity and rejects different content',async()=>{
    assert.equal((await accountPlanSchreiben(db,owner,'anlegen',values)).id,saved.id)
    await assert.rejects(()=>accountPlanSchreiben(db,owner,'anlegen',{...values,title:'Different'}))
    const rows=await db.from('trip_items').select('id');assert.ifError(rows.error);assert.equal(rows.data.length,1)
  })
  const change={tripId,itemId:saved.id,expectedVersion:saved.rowVersion,aenderung:{art:'inhalt',dayId,inhalt:{kind:'activity',title:'Edited visit',note:'Explicit saved note',startsOn:null,startsAt:'12:00',endsOn:null,endsAt:null}}}
  await check('No session, browser authority, invalid date and foreign day rejected',async()=>{
    await assert.rejects(()=>accountPlanSchreiben(db,null,'anlegen',values))
    await assert.rejects(()=>accountPlanSchreiben(db,owner,'anlegen',{...values,verified:true}))
    await assert.rejects(()=>accountPlanSchreiben(db,owner,'anlegen',{...values,startsOn:null,endsOn:'2026-10-08'}))
    await assert.rejects(()=>accountPlanSchreiben(db,owner,'anlegen',{...values,dayId:randomUUID()}))
  })
  await check('Real RLS owner enforcement even when caller lies about identity',async()=>{
    await assert.rejects(()=>accountPlanSchreiben(outside.db,outside.id,'bearbeiten',change))
    await assert.rejects(()=>accountPlanSchreiben(outside.db,owner,'bearbeiten',change))
    assert.equal((await outside.db.from('trip_items').select('*')).data.length,0)
  })
  await check('Edit persists; independent authenticated read retains exact explicit nulls',async()=>{
    saved=await accountPlanSchreiben(db,owner,'bearbeiten',change)
    const fresh=createClient(url,anon,{auth:{persistSession:false,autoRefreshToken:false}})
    assert.ifError((await fresh.auth.signInWithPassword({email:'owner@plan-fixture.invalid',password})).error)
    const read=await fresh.from('trip_items').select('*').eq('id',saved.id).single();assert.ifError(read.error)
    assert.equal(read.data.title,'Edited visit');assert.equal(read.data.starts_on,null);assert.equal(read.data.ends_on,null);assert.equal(read.data.ends_at,null)
  })
  await check('Stale version and zero affected row never success',async()=>{
    await assert.rejects(()=>accountPlanSchreiben(db,owner,'bearbeiten',change))
    await assert.rejects(()=>accountPlanSchreiben(db,owner,'bearbeiten',{...change,itemId:randomUUID(),expectedVersion:saved.rowVersion}))
  })
  await check('Protected commercial facts survive placement; generic content cannot overwrite them',async()=>{
    const commercial=await db.from('trip_items').insert({trip_id:tripId,day_id:dayId,kind:'stay',title:'Synthetic protected stay',price_amount:300,price_currency:'CHF',booking_status:'booked',booking_source:'user',booking_confirmed_at:'2026-10-07T10:00:00Z',provider:'fixture'}).select('*').single();assert.ifError(commercial.error)
    const args={tripId,itemId:commercial.data.id,expectedVersion:commercial.data.updated_at,aenderung:{art:'platzierung',dayId:null}}
    const placed=await accountPlanSchreiben(db,owner,'bearbeiten',args)
    assert.equal(placed.priceAmount,300);assert.equal(placed.provider,'fixture');assert.equal(placed.bookingStatus,'booked');assert.equal(placed.dayId,null)
    await assert.rejects(()=>accountPlanSchreiben(db,owner,'bearbeiten',{...args,expectedVersion:placed.rowVersion,aenderung:change.aenderung}))
  })
  const { accountBrowser }=await import('../../trip-plan-integrated-operating-experience-1/account-browser.mjs')
  await check('Real production Account browser -> Server Action -> canonical graph -> reload',()=>accountBrowser({url,anon,db,tripId,dayId}))
  status='PASS'
} catch(error) {for(const name of created){try { const log=spawnSync('docker',['logs','--tail','12',name],{encoding:'utf8'}); console.error((log.stdout+log.stderr).replaceAll(secret,'[redacted]').replaceAll(password,'[redacted]')) } catch {} } failure=stage+': '+String(error.message).replaceAll(secret,'[redacted]').replaceAll(password,'[redacted]');console.error(failure);process.exitCode=1}
finally {
  if(gateway?.listening)await new Promise(r=>gateway.close(r))
  for(const name of created.reverse())try{docker(['rm','-fv',name])}catch{}
  try{docker(['network','rm',run])}catch{}
  mkdirSync('docs/evidence/trip-plan-integrated-operating-experience-1',{recursive:true})
  writeFileSync(output,JSON.stringify({status,boundary:'Real GoTrue -> authenticated PostgREST/RLS -> production accountPlanSchreiben -> independent authenticated reload. Browser server-action graph refresh is a separate boundary.',results,sources,failure,cleanup:'Only run-owned containers/network removed',hostedTargets:false},null,2)+'\n')
  console.log(`${status}: ${results.length} authenticated persistence cases; ${output}`)
}
